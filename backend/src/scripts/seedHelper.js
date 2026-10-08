import User from '../models/User.js';
import Building from '../models/Building.js';
import Unit from '../models/Unit.js';
import EnergyRecord from '../models/EnergyRecord.js';
import bcrypt from 'bcryptjs';
import { generateReadings } from '../simulator/generator.js';

export async function seedDatabaseIfEmpty() {
  const count = await User.countDocuments();
  if (count > 0) return; // DB already has data

  console.log('[Auto-Seed] Database is empty. Seeding demo data...');

  const passwordHash = await bcrypt.hash('demo123', 12);
  const admin = await User.create({ name: 'Admin', email: 'admin@demo.com', passwordHash, role: 'admin' });
  const user = await User.create({ name: 'Demo User', email: 'user@demo.com', passwordHash, role: 'user' });

  const building = await Building.create({ name: 'Demo Building', address: '123 Demo St', createdBy: admin._id });

  const units = await Unit.create([
    { name: 'Flat 1A', building: building._id, owner: user._id, unitType: 'residential', monthlyLimitKwh: 300 },
    { name: 'Flat 1B', building: building._id, owner: user._id, unitType: 'residential', monthlyLimitKwh: 400 },
    { name: 'Office 1', building: building._id, owner: user._id, unitType: 'commercial', monthlyLimitKwh: 600 }
  ]);

  const endDate = new Date();
  endDate.setUTCMinutes(0, 0, 0);
  const startDate = new Date(endDate.getTime() - 90 * 24 * 3600000); // 90 days

  for (const unit of units) {
    const readings = generateReadings({ unitId: unit._id.toString(), unitType: unit.unitType, startUtc: startDate, endUtc: endDate, source: 'seed' });
    const ops = readings.map(r => ({
      updateOne: {
        filter: { unit: unit._id, timestamp: r.timestamp },
        update: { $setOnInsert: { unit: unit._id, building: building._id, owner: user._id, timestamp: r.timestamp, kwh: r.kwh, source: r.source, isAnomaly: r.isAnomaly } },
        upsert: true
      }
    }));
    for (let i = 0; i < ops.length; i += 1000) {
      await EnergyRecord.bulkWrite(ops.slice(i, i + 1000), { ordered: false });
    }
  }

  console.log('[Auto-Seed] Demo data seeded successfully.');
}
