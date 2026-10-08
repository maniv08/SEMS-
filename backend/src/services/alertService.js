/**
 * src/services/alertService.js
 */
import Alert from '../models/Alert.js';
import Unit from '../models/Unit.js';
import EnergyRecord from '../models/EnergyRecord.js';
import Settings from '../models/Settings.js';
import { getMonthlyKwh } from './analyticsService.js';

export async function checkAlertsForUnit(unitId) {
  const unit = await Unit.findById(unitId).lean();
  if (!unit || !unit.isActive) return 0;

  let alertsCreated = 0;
  const nowIst = new Date(Date.now() + 19800000);
  const year = nowIst.getUTCFullYear();
  const month = nowIst.getUTCMonth() + 1;
  const period = `${year}-${String(month).padStart(2, '0')}`;
  const dayKey = nowIst.toISOString().split('T')[0];

  // Check 80% and 100% Limits
  let settings = await Settings.findOne().lean();
  const limit = unit.monthlyLimitKwh || (settings ? settings.defaultMonthlyLimitKwh : 300);
  const monthKwh = await getMonthlyKwh(unit._id, year, month);
  const pct = (monthKwh / limit) * 100;

  if (pct >= 80) {
    const type = pct >= 100 ? 'limit_100' : 'limit_80';
    const message = pct >= 100 
      ? `Unit ${unit.name} has exceeded its monthly limit of ${limit} kWh.` 
      : `Unit ${unit.name} has reached ${pct.toFixed(1)}% of its monthly limit.`;

    const existing = await Alert.findOne({ unit: unit._id, type, period });
    if (!existing) {
      await Alert.create({
        unit: unit._id,
        owner: unit.owner,
        building: unit.building,
        type,
        message,
        period
      });
      alertsCreated++;
    }
  }

  // Check recent anomalies (latest record for today)
  const latestAnomaly = await EnergyRecord.findOne({
    unit: unit._id,
    isAnomaly: true,
    timestamp: { $gte: new Date(Date.now() - 24 * 3600000) } // last 24h
  }).sort({ timestamp: -1 });

  if (latestAnomaly) {
    const existingAnomalyAlert = await Alert.findOne({
      unit: unit._id,
      type: 'anomaly',
      dayKey
    });

    if (!existingAnomalyAlert) {
      await Alert.create({
        unit: unit._id,
        owner: unit.owner,
        building: unit.building,
        type: 'anomaly',
        message: `Anomalous energy consumption detected on ${unit.name}.`,
        relatedRecord: latestAnomaly._id,
        dayKey
      });
      alertsCreated++;
    }
  }

  return alertsCreated;
}
