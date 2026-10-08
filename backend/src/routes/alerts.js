/**
 * src/routes/alerts.js
 */
import express from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/requireRole.js';
import catchAsync from '../utils/catchAsync.js';
import { AppError } from '../utils/AppError.js';
import Alert from '../models/Alert.js';
import { getPaginationOptions, formatPaginatedResponse } from '../utils/pagination.js';
import { scopeToUser } from '../utils/scopeToUser.js';
import { checkAlertsForUnit } from '../services/alertService.js';

const router = express.Router();
router.use(authenticate);

// GET /api/v1/alerts
router.get(
  '/',
  catchAsync(async (req, res) => {
    const { status, type, unitId, owner } = req.query;
    const { limit, skip, page } = getPaginationOptions(req.query);

    const query = scopeToUser({}, req);
    if (status && status !== 'all') query.status = status;
    if (type) query.type = type;
    if (unitId) query.unit = unitId;
    if (req.user.role === 'admin' && owner) query.owner = owner;

    const [items, total] = await Promise.all([
      Alert.find(query)
        .populate('unit', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Alert.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: formatPaginatedResponse(items, total, { limit, page })
    });
  })
);

// PATCH /api/v1/alerts/:id/read
router.patch(
  '/:id/read',
  catchAsync(async (req, res) => {
    const alert = await Alert.findOne(scopeToUser({ _id: req.params.id }, req));
    if (!alert) throw new AppError('Alert not found', 404, 'NOT_FOUND');

    alert.status = 'read';
    await alert.save();

    res.status(200).json({ success: true, data: alert });
  })
);

// POST /api/v1/alerts/check
// Can be called by admin or internal systems
router.post(
  '/check',
  requireRole(['admin']),
  catchAsync(async (req, res) => {
    const { unitId } = req.body;
    if (!unitId) throw new AppError('unitId required', 400, 'VALIDATION_ERROR');

    const alertsCreated = await checkAlertsForUnit(unitId);
    res.status(200).json({ success: true, data: { alertsCreated } });
  })
);

export default router;
