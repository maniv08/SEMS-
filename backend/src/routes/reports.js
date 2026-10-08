/**
 * src/routes/reports.js
 */
import express from 'express';
import { authenticate } from '../middleware/authenticate.js';
import catchAsync from '../utils/catchAsync.js';
import { AppError } from '../utils/AppError.js';
import Unit from '../models/Unit.js';
import { scopeToUser } from '../utils/scopeToUser.js';
import EnergyRecord from '../models/EnergyRecord.js';

const router = express.Router();
router.use(authenticate);

// GET /api/v1/reports/export
router.get(
  '/export',
  catchAsync(async (req, res) => {
    const { type, unitId, from, to, groupBy } = req.query;

    const query = scopeToUser(unitId ? { _id: unitId, isActive: true } : { isActive: true }, req);
    const units = await Unit.find(query).lean();
    if (units.length === 0) throw new AppError('No units found', 404, 'NOT_FOUND');
    const unitIds = units.map(u => u._id);

    const matchQuery = { unit: { $in: unitIds } };
    if (from || to) {
      matchQuery.timestamp = {};
      if (from) matchQuery.timestamp.$gte = new Date(from);
      if (to) matchQuery.timestamp.$lte = new Date(to);
    }

    let cursor;
    let header = '';
    let rowFormatter;

    if (type === 'summary') {
      let format = '%Y-%m-%d';
      if (groupBy === 'month') format = '%Y-%m';
      if (groupBy === 'hour') format = '%Y-%m-%dT%H:00:00.000Z';

      const agg = await EnergyRecord.aggregate([
        { $match: matchQuery },
        { $group: {
            _id: { $dateToString: { format, date: "$timestamp", timezone: "Asia/Kolkata" } },
            totalKwh: { $sum: "$kwh" }
        }},
        { $sort: { _id: 1 } }
      ]);
      
      header = 'period_ist,kwh\n';
      // For summary, we can just write the whole thing
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="report_${type}_${new Date().toISOString().split('T')[0]}.csv"`);
      res.write(header);
      for (const row of agg) {
        res.write(`${row._id},${row.totalKwh.toFixed(2)}\n`);
      }
      return res.end();
    } else {
      // history
      cursor = EnergyRecord.find(matchQuery).populate('unit', 'name').sort({ timestamp: -1 }).cursor();
      header = 'timestamp_ist,unit,kwh,is_anomaly,source\n';
      rowFormatter = (record) => {
        const istIso = new Date(record.timestamp.getTime() + 19800000).toISOString().replace('Z', '+05:30');
        return `${istIso},${record.unit.name},${record.kwh},${record.isAnomaly},${record.source}\n`;
      };

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="report_${type}_${new Date().toISOString().split('T')[0]}.csv"`);
      res.write(header);
      
      for await (const record of cursor) {
        res.write(rowFormatter(record));
      }
      res.end();
    }
  })
);

export default router;
