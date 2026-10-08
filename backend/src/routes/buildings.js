/**
 * src/routes/buildings.js
 * Buildings CRUD
 */
import express from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/requireRole.js';
import catchAsync from '../utils/catchAsync.js';
import { AppError } from '../utils/AppError.js';
import Building from '../models/Building.js';
import Unit from '../models/Unit.js';
import { getPaginationOptions, formatPaginatedResponse } from '../utils/pagination.js';

const router = express.Router();

router.use(authenticate);

// POST /api/v1/buildings
router.post(
  '/',
  requireRole(['admin']),
  catchAsync(async (req, res) => {
    const { name, address } = req.body;

    const existing = await Building.findOne({ name });
    if (existing) {
      throw new AppError('Building name already exists', 409, 'CONFLICT');
    }

    const building = await Building.create({
      name,
      address,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      data: building,
    });
  })
);

// GET /api/v1/buildings
router.get(
  '/',
  catchAsync(async (req, res) => {
    const { limit, skip, page } = getPaginationOptions(req.query);

    const isAdmin = req.user.role === 'admin';
    const selectFields = isAdmin ? '' : '_id name'; // user gets limited fields

    const [items, total] = await Promise.all([
      Building.find()
        .select(selectFields)
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Building.countDocuments(),
    ]);

    res.status(200).json({
      success: true,
      data: formatPaginatedResponse(items, total, { limit, page }),
    });
  })
);

// GET /api/v1/buildings/:id
router.get(
  '/:id',
  catchAsync(async (req, res) => {
    const isAdmin = req.user.role === 'admin';
    const selectFields = isAdmin ? '' : '_id name';

    const building = await Building.findById(req.params.id).select(selectFields).lean();

    if (!building) {
      throw new AppError('Building not found', 404, 'NOT_FOUND');
    }

    res.status(200).json({
      success: true,
      data: building,
    });
  })
);

// PUT /api/v1/buildings/:id
router.put(
  '/:id',
  requireRole(['admin']),
  catchAsync(async (req, res) => {
    const { name, address } = req.body;

    if (name) {
      const existing = await Building.findOne({ name, _id: { $ne: req.params.id } });
      if (existing) {
        throw new AppError('Building name already exists', 409, 'CONFLICT');
      }
    }

    const building = await Building.findByIdAndUpdate(
      req.params.id,
      { $set: { name, address } },
      { new: true, runValidators: true }
    );

    if (!building) {
      throw new AppError('Building not found', 404, 'NOT_FOUND');
    }

    res.status(200).json({
      success: true,
      data: building,
    });
  })
);

// DELETE /api/v1/buildings/:id
router.delete(
  '/:id',
  requireRole(['admin']),
  catchAsync(async (req, res) => {
    const building = await Building.findById(req.params.id);
    if (!building) {
      throw new AppError('Building not found', 404, 'NOT_FOUND');
    }

    const unitCount = await Unit.countDocuments({ building: req.params.id, isActive: true });
    if (unitCount > 0) {
      throw new AppError('Cannot delete a building that has active units', 409, 'CONFLICT');
    }

    await Building.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Building deleted',
    });
  })
);

export default router;
