/**
 * src/simulator/ticker.js
 * Runs every hour to append simulated data to active units.
 */
import cron from 'node-cron';
import Unit from '../models/Unit.js';
import { generateReadings } from './generator.js';
import { ingestReading } from '../services/energyService.js';

// An arbitrary epoch to ensure hourIndex is consistent between ticker and seed
const EPOCH = new Date('2026-07-01T00:00:00Z').getTime();

export function getHourIndex(timestamp) {
  const current = new Date(timestamp).getTime();
  return Math.floor((current - EPOCH) / 3600000);
}

export function startSimulator() {
  if (process.env.SIMULATOR_ENABLED !== 'true') {
    console.log('[Simulator] Disabled in .env (SIMULATOR_ENABLED!=true)');
    return;
  }

  console.log('[Simulator] Ticker started, will run at minute 0 past every hour.');

  cron.schedule('0 * * * *', async () => {
    try {
      const now = new Date();
      now.setUTCMinutes(0, 0, 0);

      const units = await Unit.find({ isActive: true }).lean();
      
      let appended = 0;
      const hourIndex = getHourIndex(now);

      for (const unit of units) {
        const readings = generateReadings({
          unitId: unit._id.toString(),
          unitType: unit.unitType,
          startUtc: now,
          endUtc: now,
          source: 'simulator',
          initialHourIndex: hourIndex,
        });

        if (readings.length > 0) {
          const reading = readings[0];
          await ingestReading({
            unitId: unit._id.toString(),
            timestamp: reading.timestamp,
            kwh: reading.kwh,
            source: reading.source,
            isAnomaly: reading.isAnomaly,
          });
          
          // TODO Stage 4: Trigger alert check
          appended++;
        }
      }

      console.log(`[Simulator] tick: appended ${appended} readings for ${now.toISOString()}`);
    } catch (error) {
      console.error('[Simulator] tick failed:', error);
    }
  });
}
