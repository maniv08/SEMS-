import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import Unit from '../models/Unit.js';
import EnergyRecord from '../models/EnergyRecord.js';
import Settings from '../models/Settings.js';
import User from '../models/User.js';
import Building from '../models/Building.js';
import { generateReadings } from '../simulator/generator.js';

export async function generateSimulatorData() {
  try {
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
      console.log('[Seed] Connected to database');
    }

    const demoEmail = 'user@demo.com';
    let demoUser = await User.findOne({ email: demoEmail });
    if (!demoUser) {
      console.log(`[Seed] Creating demo user: ${demoEmail}`);
      demoUser = await User.create({
        name: 'Demo User',
        email: demoEmail,
        passwordHash: '$2a$12$R.S/Hh2k./.R54/lY7zDzeP2.eY.Q6Z0X981aR/Xk/uI7I/b68wHq', // password123
        role: 'user',
      });
    }

    let demoBuilding = await Building.findOne({ name: 'Demo Building' });
    if (!demoBuilding) {
      console.log(`[Seed] Creating demo building`);
      const adminUser = await User.findOne({ role: 'admin' });
      demoBuilding = await Building.create({
        name: 'Demo Building',
        address: '123 Demo Street',
        createdBy: adminUser ? adminUser._id : demoUser._id,
      });
    }

    const demoUnitsCount = await Unit.countDocuments({ owner: demoUser._id });
    if (demoUnitsCount === 0) {
      console.log(`[Seed] Creating 3 demo units for ${demoEmail}`);
      await Unit.create([
        {
          name: 'Flat 1A (High Usage)',
          building: demoBuilding._id,
          owner: demoUser._id,
          unitType: 'residential',
          monthlyLimitKwh: 300,
        },
        {
          name: 'Flat 1B (Normal)',
          building: demoBuilding._id,
          owner: demoUser._id,
          unitType: 'residential',
          monthlyLimitKwh: 400,
        },
        {
          name: 'Office 1 (Commercial)',
          building: demoBuilding._id,
          owner: demoUser._id,
          unitType: 'commercial',
          monthlyLimitKwh: 600,
        }
      ]);
    }

    const units = await Unit.find({ isActive: true }).lean();
    if (units.length === 0) {
      console.log('[Seed] No active units found.');
      process.exit(1);
    }

    const endDate = new Date();
    endDate.setUTCMinutes(0, 0, 0); // Current hour
    const startDate = new Date(endDate.getTime() - 90 * 24 * 3600000); // 90 days ago

    let totalInserted = 0;

    for (const unit of units) {
      console.log(`[Seed] Generating data for unit ${unit.name} (${unit._id})...`);
      
      const readings = generateReadings({
        unitId: unit._id.toString(),
        unitType: unit.unitType,
        startUtc: startDate,
        endUtc: endDate,
        source: 'seed'
      });

      console.log(`[Seed] Generated ${readings.length} readings. Inserting...`);
      
      // Bulk insert idempotently (unordered to allow skipping duplicates)
      const ops = readings.map(r => ({
        updateOne: {
          filter: { unit: unit._id, timestamp: r.timestamp },
          update: {
            $setOnInsert: {
              unit: unit._id,
              building: unit.building,
              owner: unit.owner,
              timestamp: r.timestamp,
              kwh: r.kwh,
              source: r.source,
              isAnomaly: r.isAnomaly,
            }
          },
          upsert: true
        }
      }));

      // Execute in chunks of 1000 to not overload memory
      const chunkSize = 1000;
      for (let i = 0; i < ops.length; i += chunkSize) {
        const chunk = ops.slice(i, i + chunkSize);
        const result = await EnergyRecord.bulkWrite(chunk, { ordered: false });
        totalInserted += result.upsertedCount;
      }
    }

    // Force inject alerts for demo purposes to populate the UI and trigger recommendations
    console.log(`[Seed] Generating alerts for seeded data...`);
    const Alert = (await import('../models/Alert.js')).default;
    const nowUtc = new Date();
    const year = nowUtc.getUTCFullYear();
    const month = nowUtc.getUTCMonth() + 1;
    const period = `${year}-${String(month).padStart(2, '0')}`;

    for (const unit of units) {
      if (unit.name.includes('High Usage')) {
        await Alert.create({
          unit: unit._id,
          owner: unit.owner,
          building: unit.building,
          type: 'limit_80',
          message: `Unit ${unit.name} has reached 84.2% of its monthly limit.`,
          period,
          status: 'open',
          createdAt: new Date(nowUtc.getTime() - 2 * 3600000) // 2 hours ago
        });
      }

      if (unit.name.includes('Commercial')) {
        // Inject 3 anomalies over the last 7 days to trigger 'REPEATED_ANOMALIES' recommendation
        const daysAgo = [1, 3, 5];
        for (const days of daysAgo) {
          const timestamp = new Date(nowUtc.getTime() - days * 24 * 3600000);
          await Alert.create({
            unit: unit._id,
            owner: unit.owner,
            building: unit.building,
            type: 'anomaly',
            message: `Anomalous energy consumption detected on ${unit.name}.`,
            period,
            status: days === 1 ? 'open' : 'read',
            createdAt: timestamp,
            dayKey: timestamp.toISOString().split('T')[0]
          });
        }
      }
    }

    if (process.argv[1].endsWith('seedData.js')) process.exit(0);
  } catch (error) {
    console.error('[Seed] Error:', error);
    if (process.argv[1].endsWith('seedData.js')) process.exit(1);
    throw error;
  }
}

if (process.argv[1].endsWith('seedData.js')) {
  generateSimulatorData();
}
