/**
 * src/routes/units.js
 * Units CRUD
 */
import express from 'express';
import crypto from 'crypto';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/requireRole.js';
import catchAsync from '../utils/catchAsync.js';
import { AppError } from '../utils/AppError.js';
import Unit from '../models/Unit.js';
import Building from '../models/Building.js';
import Settings from '../models/Settings.js';
import { getPaginationOptions, formatPaginatedResponse } from '../utils/pagination.js';
import { scopeToUser } from '../utils/scopeToUser.js';

const router = express.Router();

router.use(authenticate);

// Generate a new device key and its hash
const generateDeviceKey = () => {
  const plainKey = `ek_${crypto.randomBytes(16).toString('hex')}`;
  const hash = crypto.createHash('sha256').update(plainKey).digest('hex');
  return { plainKey, hash };
};

// POST /api/v1/units
router.post(
  '/',
  catchAsync(async (req, res) => {
    const { name, building, unitType, monthlyLimitKwh, owner } = req.body;

    const buildingExists = await Building.findById(building);
    if (!buildingExists) {
      throw new AppError('Building not found', 404, 'NOT_FOUND');
    }

    const isAdmin = req.user.role === 'admin';
    const assignedOwner = isAdmin && owner ? owner : req.user._id;

    if (!isAdmin && owner && owner.toString() !== req.user._id.toString()) {
      throw new AppError('Cannot create a unit for another user', 403, 'FORBIDDEN');
    }

    let finalLimit = monthlyLimitKwh;
    if (!finalLimit) {
      const settings = await Settings.findOne();
      finalLimit = settings ? settings.defaultMonthlyLimitKwh : 300;
    }

    const { plainKey, hash } = generateDeviceKey();

    const unit = await Unit.create({
      name,
      building,
      unitType,
      monthlyLimitKwh: finalLimit,
      owner: assignedOwner,
      deviceKey: hash,
    });

    // Populate for response
    await unit.populate('building', 'name');

    // Mongoose toObject excludes select:false fields automatically.
    const unitObj = unit.toObject();
    
    res.status(201).json({
      success: true,
      data: {
        unit: unitObj,
        deviceKeyPlain: plainKey,
      },
      message: 'Unit created. Save the device key — it will not be shown again.',
    });
  })
);

// GET /api/v1/units
router.get(
  '/',
  catchAsync(async (req, res) => {
    const { limit, skip, page } = getPaginationOptions(req.query);
    const { building, owner } = req.query;

    let query = {};
    if (building) query.building = building;
    if (owner) query.owner = owner;

    query = scopeToUser(query, req);

    const [items, total] = await Promise.all([
      Unit.find(query)
        .populate('building', 'name')
        .populate('owner', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Unit.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: formatPaginatedResponse(items, total, { limit, page }),
    });
  })
);

// GET /api/v1/units/:id
router.get(
  '/:id',
  catchAsync(async (req, res) => {
    const query = scopeToUser({ _id: req.params.id }, req);
    
    const unit = await Unit.findOne(query)
      .populate('building', 'name')
      .populate('owner', 'name email')
      .lean();

    if (!unit) {
      throw new AppError('Unit not found', 404, 'NOT_FOUND');
    }

    res.status(200).json({
      success: true,
      data: unit,
    });
  })
);

// PUT /api/v1/units/:id
router.put(
  '/:id',
  catchAsync(async (req, res) => {
    const query = scopeToUser({ _id: req.params.id }, req);
    const existingUnit = await Unit.findOne(query);

    if (!existingUnit) {
      throw new AppError('Unit not found', 404, 'NOT_FOUND');
    }

    const isAdmin = req.user.role === 'admin';
    const { name, monthlyLimitKwh, building, owner, unitType, isActive } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (monthlyLimitKwh !== undefined) updateData.monthlyLimitKwh = monthlyLimitKwh;

    if (isAdmin) {
      if (building !== undefined) updateData.building = building;
      if (owner !== undefined) updateData.owner = owner;
      if (unitType !== undefined) updateData.unitType = unitType;
      if (isActive !== undefined) updateData.isActive = isActive;
    }

    if (updateData.building) {
      const buildingExists = await Building.findById(updateData.building);
      if (!buildingExists) throw new AppError('Building not found', 404, 'NOT_FOUND');
    }

    const updatedUnit = await Unit.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .populate('building', 'name')
      .populate('owner', 'name email')
      .lean();

    res.status(200).json({
      success: true,
      data: updatedUnit,
    });
  })
);

// DELETE /api/v1/units/:id (Admin only)
router.delete(
  '/:id',
  requireRole(['admin']),
  catchAsync(async (req, res) => {
    const unit = await Unit.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!unit) {
      throw new AppError('Unit not found', 404, 'NOT_FOUND');
    }

    res.status(200).json({
      success: true,
      message: 'Unit deactivated',
    });
  })
);

// POST /api/v1/units/:id/regenerate-key
router.post(
  '/:id/regenerate-key',
  catchAsync(async (req, res) => {
    const query = scopeToUser({ _id: req.params.id }, req);
    const unit = await Unit.findOne(query);

    if (!unit) {
      throw new AppError('Unit not found', 404, 'NOT_FOUND');
    }

    const { plainKey, hash } = generateDeviceKey();
    
    unit.deviceKey = hash;
    await unit.save();

    res.status(200).json({
      success: true,
      data: { deviceKeyPlain: plainKey },
    });
  })
);

export default router;
