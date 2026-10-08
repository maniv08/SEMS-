/**
 * src/routes/settings.js
 * Settings CRUD (Singleton)
 */
import express from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/requireRole.js';
import catchAsync from '../utils/catchAsync.js';
import Settings from '../models/Settings.js';

const router = express.Router();

router.use(authenticate);
router.use(requireRole(['admin']));

// GET /api/v1/settings
router.get(
  '/',
  catchAsync(async (req, res) => {
    let settings = await Settings.findOne().lean();
    
    if (!settings) {
      // Create defaults if not exists
      settings = await Settings.create({
        defaultMonthlyLimitKwh: 300,
        tariffSlabs: [
          { upToKwh: 100,  ratePerKwh: 2.50 },
          { upToKwh: 200,  ratePerKwh: 3.25 },
          { upToKwh: 500,  ratePerKwh: 5.00 },
          { upToKwh: null, ratePerKwh: 6.50 }
        ],
        currencySymbol: '₹',
        updatedBy: req.user._id,
      });
      settings = settings.toObject();
    }

    res.status(200).json({
      success: true,
      data: settings,
    });
  })
);

// PUT /api/v1/settings
router.put(
  '/',
  catchAsync(async (req, res) => {
    const { defaultMonthlyLimitKwh, tariffSlabs, currencySymbol } = req.body;

    const updateData = { updatedBy: req.user._id };
    if (defaultMonthlyLimitKwh !== undefined) updateData.defaultMonthlyLimitKwh = defaultMonthlyLimitKwh;
    if (tariffSlabs !== undefined) updateData.tariffSlabs = tariffSlabs;
    if (currencySymbol !== undefined) updateData.currencySymbol = currencySymbol;

    const settings = await Settings.findOneAndUpdate(
      {}, // query (match the first/only document)
      { $set: updateData },
      { new: true, runValidators: true, upsert: true }
    ).lean();

    res.status(200).json({
      success: true,
      data: settings,
    });
  })
);

export default router;
