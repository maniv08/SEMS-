/**
 * src/routes/predictions.js
 */
import express from 'express';
import { authenticate } from '../middleware/authenticate.js';
import catchAsync from '../utils/catchAsync.js';
import { AppError } from '../utils/AppError.js';
import Unit from '../models/Unit.js';
import { getForecast } from '../services/predictionService.js';
import { scopeToUser } from '../utils/scopeToUser.js';

const router = express.Router();
router.use(authenticate);

// GET /api/v1/predictions/forecast
router.get(
  '/forecast',
  catchAsync(async (req, res) => {
    const { unitId } = req.query;
    if (!unitId) throw new AppError('unitId required', 400, 'VALIDATION_ERROR');

    const unit = await Unit.findOne(scopeToUser({ _id: unitId, isActive: true }, req));
    if (!unit) throw new AppError('Unit not found', 404, 'NOT_FOUND');

    const data = await getForecast(unit._id);
    res.status(200).json({ success: true, data });
  })
);

export default router;
