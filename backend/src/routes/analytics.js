/**
 * src/routes/analytics.js
 */
import express from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/requireRole.js';
import catchAsync from '../utils/catchAsync.js';
import Unit from '../models/Unit.js';
import { getSummary, getConsumption, getPeak, getAdminOverview } from '../services/analyticsService.js';
import { scopeToUser } from '../utils/scopeToUser.js';

const router = express.Router();

router.use(authenticate);

async function getRequestedUnits(req) {
  const { unitId } = req.query;
  const query = scopeToUser(unitId ? { _id: unitId, isActive: true } : { isActive: true }, req);
  const units = await Unit.find(query).lean();
  return units;
}

// GET /api/v1/analytics/summary
router.get(
  '/summary',
  catchAsync(async (req, res) => {
    const units = await getRequestedUnits(req);
    if (units.length === 0) {
      return res.status(200).json({ success: true, data: null, message: 'No units found' });
    }
    const data = await getSummary(units);
    res.status(200).json({ success: true, data });
  })
);

// GET /api/v1/analytics/consumption
router.get(
  '/consumption',
  catchAsync(async (req, res) => {
    const { period, date } = req.query; // period=day|week|month, date=YYYY-MM-DD
    const units = await getRequestedUnits(req);
    if (units.length === 0) {
      return res.status(200).json({ success: true, data: { series: [], comparison: [], total: 0, unit: 'kWh' } });
    }
    const data = await getConsumption(units, period, date);
    console.log('Consumption data series length:', data.series.length);
    if (data.series.length > 0) {
      console.log('First point:', data.series[0]);
    }
    res.status(200).json({ success: true, data });
  })
);

// GET /api/v1/analytics/peak
router.get(
  '/peak',
  catchAsync(async (req, res) => {
    const { from, to } = req.query;
    const units = await getRequestedUnits(req);
    if (units.length === 0) {
      return res.status(200).json({ success: true, data: null });
    }
    const data = await getPeak(units, from, to);
    res.status(200).json({ success: true, data });
  })
);

// GET /api/v1/analytics/admin/overview
router.get(
  '/admin/overview',
  requireRole(['admin']),
  catchAsync(async (req, res) => {
    const data = await getAdminOverview();
    res.status(200).json({ success: true, data });
  })
);

export default router;
