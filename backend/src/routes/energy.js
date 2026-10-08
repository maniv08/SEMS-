/**
 * src/routes/energy.js
 */
import express from 'express';
import crypto from 'crypto';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/requireRole.js';
import catchAsync from '../utils/catchAsync.js';
import { AppError } from '../utils/AppError.js';
import EnergyRecord from '../models/EnergyRecord.js';
import Unit from '../models/Unit.js';
import { ingestReading } from '../services/energyService.js';
import { getPaginationOptions, formatPaginatedResponse } from '../utils/pagination.js';
import { scopeToUser } from '../utils/scopeToUser.js';

const router = express.Router();

/**
 * Device Authentication Middleware
 * Allows request if `x-device-key` header is valid, OR if valid JWT + admin role.
 */
const authenticateDeviceOrAdmin = catchAsync(async (req, res, next) => {
  const deviceKeyPlain = req.headers['x-device-key'];

  if (deviceKeyPlain) {
    const hash = crypto.createHash('sha256').update(deviceKeyPlain).digest('hex');
    const unit = await Unit.findOne({ deviceKey: hash, isActive: true });
    
    if (!unit) {
      throw new AppError('Invalid device key', 401, 'UNAUTHORIZED');
    }
    
    // Attach unit to request for the route handler
    req.deviceUnit = unit;
    return next();
  }

  // Fallback to standard JWT admin auth
  authenticate(req, res, (err) => {
    if (err) return next(err);
    requireRole(['admin'])(req, res, next);
  });
});

// POST /api/v1/energy/ingest
router.post(
  '/ingest',
  authenticateDeviceOrAdmin,
  catchAsync(async (req, res) => {
    const { unitId, timestamp, kwh, source } = req.body;

    // If authenticated via device key, enforce that the unitId matches the device's unit
    if (req.deviceUnit && req.deviceUnit._id.toString() !== unitId) {
      throw new AppError('Device key does not match unitId', 401, 'UNAUTHORIZED');
    }

    try {
      const record = await ingestReading({
        unitId,
        timestamp: new Date(timestamp), // Assumes valid ISO string from validator
        kwh,
        source,
      });

      res.status(200).json({
        success: true,
        data: record,
        message: 'Reading recorded',
      });
    } catch (error) {
      if (error.message === 'Unit not found') {
        throw new AppError(error.message, 404, 'NOT_FOUND');
      }
      throw error;
    }
  })
);

// GET /api/v1/energy/history
router.get(
  '/history',
  authenticate,
  catchAsync(async (req, res) => {
    const { unitId, from, to, anomalyOnly } = req.query;
    const { limit, skip, page } = getPaginationOptions(req.query);

    if (!unitId) throw new AppError('unitId is required', 400, 'VALIDATION_ERROR');

    // Ownership check via scopeToUser
    const unitQuery = scopeToUser({ _id: unitId }, req);
    const unit = await Unit.findOne(unitQuery);
    if (!unit) throw new AppError('Unit not found', 404, 'NOT_FOUND');

    const query = { unit: unit._id };
    
    if (from || to) {
      query.timestamp = {};
      if (from) query.timestamp.$gte = new Date(from);
      if (to) query.timestamp.$lte = new Date(to);
    }
    
    if (anomalyOnly === 'true') {
      query.isAnomaly = true;
    }

    const [items, total] = await Promise.all([
      EnergyRecord.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      EnergyRecord.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: formatPaginatedResponse(items, total, { limit, page }),
    });
  })
);

// GET /api/v1/energy/export
router.get(
  '/export',
  authenticate,
  catchAsync(async (req, res) => {
    const { unitId, from, to, anomalyOnly } = req.query;

    if (!unitId) throw new AppError('unitId is required', 400, 'VALIDATION_ERROR');

    const unitQuery = scopeToUser({ _id: unitId }, req);
    const unit = await Unit.findOne(unitQuery);
    if (!unit) throw new AppError('Unit not found', 404, 'NOT_FOUND');

    const query = { unit: unit._id };
    if (from || to) {
      query.timestamp = {};
      if (from) query.timestamp.$gte = new Date(from);
      if (to) query.timestamp.$lte = new Date(to);
    }
    if (anomalyOnly === 'true') {
      query.isAnomaly = true;
    }

    const cursor = EnergyRecord.find(query).sort({ timestamp: -1 }).cursor();

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="energy_${unitId}_${new Date().toISOString().split('T')[0]}.csv"`);

    res.write('timestamp_ist,kwh,is_anomaly,source\n');

    for await (const record of cursor) {
      // Convert to IST for CSV
      const istMs = record.timestamp.getTime() + 19800000;
      const istIso = new Date(istMs).toISOString().replace('Z', '+05:30');
      res.write(`${istIso},${record.kwh},${record.isAnomaly},${record.source}\n`);
    }

    res.end();
  })
);

export default router;
