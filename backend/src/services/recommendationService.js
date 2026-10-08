/**
 * src/services/recommendationService.js
 */
import Unit from '../models/Unit.js';
import Alert from '../models/Alert.js';
import EnergyRecord from '../models/EnergyRecord.js';
import Settings from '../models/Settings.js';
import { getMonthlyKwh, computeCost } from './analyticsService.js';

export async function getRecommendations(units) {
  let recommendations = [];
  const settings = await Settings.findOne().lean() || { tariffSlabs: [] };

  const istOffset = 19800000;
  const nowUtc = new Date();
  const nowIst = new Date(nowUtc.getTime() + istOffset);
  const year = nowIst.getUTCFullYear();
  const month = nowIst.getUTCMonth() + 1;
  const todayStartUtc = new Date(Date.UTC(year, month - 1, nowIst.getUTCDate(), -5, -30, 0));
  const twoWeeksAgoUtc = new Date(todayStartUtc.getTime() - 14 * 24 * 3600000);

  for (const unit of units) {
    const monthKwh = await getMonthlyKwh(unit._id, year, month);

    // R1: HIGH_EVENING_PEAK (18:00–22:00 > 35%)
    const last14Days = await EnergyRecord.find({
      unit: unit._id,
      timestamp: { $gte: twoWeeksAgoUtc, $lt: todayStartUtc }
    }).lean();

    let totalKwh14 = 0;
    let eveningKwh14 = 0;
    let nightKwh14 = 0; // For R5 (00:00–05:00)

    for (const r of last14Days) {
      const h = new Date(r.timestamp.getTime() + istOffset).getUTCHours();
      totalKwh14 += r.kwh;
      if (h >= 18 && h < 22) eveningKwh14 += r.kwh;
      if (h >= 0 && h < 5) nightKwh14 += r.kwh;
    }

    if (totalKwh14 > 0) {
      const eveningShare = (eveningKwh14 / totalKwh14) * 100;
      if (eveningShare > 35) {
        const reducible = (totalKwh14 / 14) * ((eveningShare - 25) / 100) * 0.5;
        const savingKwh = reducible * 30;
        const savingRs = computeCost(monthKwh, settings.tariffSlabs) - computeCost(Math.max(0, monthKwh - savingKwh), settings.tariffSlabs);
        recommendations.push({
          ruleId: 'HIGH_EVENING_PEAK',
          priority: 2,
          title: 'High evening peak usage',
          description: `Your unit ${unit.name} consumes ${eveningShare.toFixed(0)}% of daily energy between 18:00–22:00.`,
          estimatedSavingKwh: Number(savingKwh.toFixed(1)),
          estimatedSavingRs: Number(savingRs.toFixed(2)),
          triggeredAt: nowUtc.toISOString()
        });
      }

      // R5: HIGH_NIGHT_USAGE (00:00-05:00 > 25%)
      const nightShare = (nightKwh14 / totalKwh14) * 100;
      if (nightShare > 25) {
        const reducible = (totalKwh14 / 14) * ((nightShare - 15) / 100) * 0.6;
        const savingKwh = reducible * 30;
        const savingRs = computeCost(monthKwh, settings.tariffSlabs) - computeCost(Math.max(0, monthKwh - savingKwh), settings.tariffSlabs);
        recommendations.push({
          ruleId: 'HIGH_NIGHT_USAGE',
          priority: 3,
          title: 'High night usage',
          description: `${nightShare.toFixed(0)}% of energy is used between midnight and 5 AM on ${unit.name}.`,
          estimatedSavingKwh: Number(savingKwh.toFixed(1)),
          estimatedSavingRs: Number(savingRs.toFixed(2)),
          triggeredAt: nowUtc.toISOString()
        });
      }
    }

    // R2: MONTH_OVER_MONTH_RISE
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const prevMonthKwh = await getMonthlyKwh(unit._id, prevYear, prevMonth);
    const daysElapsed = Math.max(1, nowIst.getUTCDate());
    const daysInMonth = new Date(year, month, 0).getDate();
    const projected = (monthKwh / daysElapsed) * daysInMonth;

    if (daysElapsed >= 7 && prevMonthKwh > 0) {
      const risePct = ((projected - prevMonthKwh) / prevMonthKwh) * 100;
      if (risePct > 15) {
        const excess = projected - prevMonthKwh;
        const savingKwh = excess * 0.7;
        const savingRs = computeCost(projected, settings.tariffSlabs) - computeCost(Math.max(0, projected - savingKwh), settings.tariffSlabs);
        recommendations.push({
          ruleId: 'MONTH_OVER_MONTH_RISE',
          priority: 1,
          title: 'Monthly consumption trending up',
          description: `Projected usage for ${unit.name} is ${risePct.toFixed(0)}% higher than last month.`,
          estimatedSavingKwh: Number(savingKwh.toFixed(1)),
          estimatedSavingRs: Number(savingRs.toFixed(2)),
          triggeredAt: nowUtc.toISOString()
        });
      }
    }

    // R3: REPEATED_ANOMALIES
    const sevenDaysAgoIst = new Date(nowIst.getTime() - 7 * 24 * 3600000);
    const recentAnomalies = await Alert.countDocuments({
      unit: unit._id,
      type: 'anomaly',
      createdAt: { $gte: sevenDaysAgoIst }
    });
    
    if (recentAnomalies >= 3) {
      // rough estimation for saving
      const savingKwh = recentAnomalies * 2 * 4; 
      const savingRs = computeCost(monthKwh, settings.tariffSlabs) - computeCost(Math.max(0, monthKwh - savingKwh), settings.tariffSlabs);
      recommendations.push({
        ruleId: 'REPEATED_ANOMALIES',
        priority: 1,
        title: 'Equipment fault suspected',
        description: `${unit.name} had ${recentAnomalies} anomalous readings in 7 days.`,
        estimatedSavingKwh: Number(savingKwh.toFixed(1)),
        estimatedSavingRs: Number(savingRs.toFixed(2)),
        triggeredAt: nowUtc.toISOString()
      });
    }

    // R4: USAGE_ABOVE_80_PCT
    const limit = unit.monthlyLimitKwh || 300;
    const usagePct = (monthKwh / limit) * 100;
    if (usagePct >= 80 && daysInMonth > daysElapsed) {
      recommendations.push({
        ruleId: 'USAGE_ABOVE_80_PCT',
        priority: 2,
        title: 'Budget warning',
        description: `${unit.name} has used ${usagePct.toFixed(0)}% of limit with ${daysInMonth - daysElapsed} days left.`,
        estimatedSavingKwh: 0,
        estimatedSavingRs: 0,
        triggeredAt: nowUtc.toISOString()
      });
    }
  }

  // Sort: Priority ascending, estimatedSavingRs descending
  recommendations.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return b.estimatedSavingRs - a.estimatedSavingRs;
  });

  return recommendations;
}
