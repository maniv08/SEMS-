import express from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/requireRole.js';
import catchAsync from '../utils/catchAsync.js';
import { AppError } from '../utils/AppError.js';
import Unit from '../models/Unit.js';
import { ingestReading } from '../services/energyService.js';
import stream from 'stream';
import csvParser from 'csv-parser';
import xlsx from 'xlsx';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post(
  '/energy/import',
  authenticate,
  requireRole(['admin']),
  upload.single('file'),
  catchAsync(async (req, res) => {
    if (!req.file) throw new AppError('No file uploaded', 400, 'VALIDATION_ERROR');
    const { unitId } = req.body;
    if (!unitId) throw new AppError('unitId is required', 400, 'VALIDATION_ERROR');

    const unit = await Unit.findById(unitId);
    if (!unit) throw new AppError('Unit not found', 404, 'NOT_FOUND');

    const originalName = req.file.originalname.toLowerCase();
    const records = [];

    if (originalName.endsWith('.csv')) {
      const bufferStream = new stream.PassThrough();
      bufferStream.end(req.file.buffer);
      await new Promise((resolve, reject) => {
        bufferStream
          .pipe(csvParser())
          .on('data', (data) => records.push(data))
          .on('end', resolve)
          .on('error', reject);
      });
    } else if (originalName.endsWith('.json')) {
      try {
        const parsed = JSON.parse(req.file.buffer.toString());
        if (!Array.isArray(parsed)) throw new Error('JSON must be an array');
        records.push(...parsed);
      } catch (err) {
        throw new AppError('Invalid JSON format', 400, 'VALIDATION_ERROR');
      }
    } else if (originalName.endsWith('.xlsx') || originalName.endsWith('.xls')) {
      try {
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const firstSheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[firstSheetName];
        const parsed = xlsx.utils.sheet_to_json(sheet);
        records.push(...parsed);
      } catch (err) {
        throw new AppError('Invalid Excel format', 400, 'VALIDATION_ERROR');
      }
    } else {
      throw new AppError('Unsupported file format. Please upload CSV, JSON, or Excel.', 400, 'VALIDATION_ERROR');
    }

    let inserted = 0;
    let skipped = 0;

    for (const record of records) {
      if (!record.timestamp_ist || record.kwh === undefined) {
        skipped++;
        continue;
      }

      let dateUtc;
      try {
        let ts = record.timestamp_ist.toString();
        // If the excel file parsed the date, we might get weird formats.
        // Assuming string ISO format. If no offset, assume +05:30
        if (!ts.includes('+') && !ts.includes('Z')) {
          ts = ts + '+05:30';
        }
        dateUtc = new Date(ts);
        if (isNaN(dateUtc.getTime())) throw new Error('Invalid date');
      } catch (e) {
        skipped++;
        continue;
      }

      try {
        await ingestReading({
          unitId,
          timestamp: dateUtc,
          kwh: Number(record.kwh),
          source: record.source || 'csv_import',
        });
        inserted++;
      } catch (e) {
        skipped++;
      }
    }

    res.status(200).json({
      success: true,
      data: { inserted, skipped },
      message: 'Import complete'
    });
  })
);

export default router;
