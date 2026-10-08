/**
 * src/routes/recommendations.js
 */
import express from 'express';
import { authenticate } from '../middleware/authenticate.js';
import catchAsync from '../utils/catchAsync.js';
import Unit from '../models/Unit.js';
import { getRecommendations } from '../services/recommendationService.js';
import { scopeToUser } from '../utils/scopeToUser.js';

const router = express.Router();
router.use(authenticate);

// GET /api/v1/recommendations
router.get(
  '/',
  catchAsync(async (req, res) => {
    const { unitId } = req.query;
    const query = scopeToUser(unitId ? { _id: unitId, isActive: true } : { isActive: true }, req);
    const units = await Unit.find(query).lean();
    
    if (units.length === 0) {
      return res.status(200).json({ success: true, data: { recommendations: [] } });
    }

    const recommendations = await getRecommendations(units);
    res.status(200).json({ success: true, data: { recommendations } });
  })
);

export default router;
