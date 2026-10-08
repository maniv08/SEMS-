/**
 * src/simulator/generator.js
 * Generates energy readings based on unitType, deterministic seed, and rules.
 */
import { mulberry32 } from './rng.js';

const BASE_LOAD = {
  residential: 0.30,
  commercial: 0.65,
  common_area: 0.20,
};

const HOURLY_MULT = {
  residential: [
    0.45, 0.35, 0.30, 0.30, 0.35, 0.50, 0.80, 1.20, 1.50, 1.30, 1.10, 1.00, 
    1.10, 1.15, 1.00, 0.95, 1.00, 1.20, 1.80, 2.20, 2.10, 1.90, 1.40, 0.80,
  ],
  commercial: [
    0.20, 0.15, 0.15, 0.15, 0.15, 0.20, 0.25, 0.30, 0.80, 1.40, 1.60, 1.70, 
    1.60, 1.50, 1.60, 1.65, 1.55, 1.20, 0.60, 0.40, 0.30, 0.25, 0.20, 0.20,
  ],
  common_area: [
    0.35, 0.30, 0.30, 0.30, 0.30, 0.40, 0.55, 0.70, 0.80, 0.75, 0.70, 0.65, 
    0.65, 0.65, 0.65, 0.65, 0.70, 0.75, 0.90, 1.00, 0.95, 0.90, 0.75, 0.55,
  ],
};

const WEEKEND_FACTOR = {
  residential: { weekday: 1.00, weekend: 1.15 },
  commercial: { weekday: 1.00, weekend: 0.35 },
  common_area: { weekday: 1.00, weekend: 0.90 },
};

function seasonalFactor(month, unitType) {
  const SEASONAL = {
    residential: [1.05, 1.00, 1.15, 1.30, 1.40, 1.35, 1.10, 1.05, 1.00, 1.05, 1.10, 1.10],
    commercial:  [1.00, 1.00, 1.05, 1.15, 1.20, 1.15, 1.05, 1.00, 1.00, 1.00, 1.00, 1.00],
    common_area: [1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00],
  };
  return SEASONAL[unitType][month];
}

/**
 * Generate hourly energy readings for one unit over a date range.
 * PURE FUNCTION — no side effects, no DB access.
 */
export function generateReadings({ unitId, unitType, startUtc, endUtc, source = 'seed', baseLoadMultiplier = 1.0, initialHourIndex = 0 }) {
  // Derive seed from ObjectId string (last 8 hex chars -> uint32)
  const seedHex = unitId.slice(-8);
  const initialSeed = parseInt(seedHex, 16);
  const rng = mulberry32(initialSeed);

  // Advance PRNG by initialHourIndex so that noise is deterministic per absolute hour
  for (let i = 0; i < initialHourIndex; i++) {
    rng(); 
  }

  const results = [];
  
  // Truncate start to start of hour
  let current = new Date(startUtc);
  current.setUTCMinutes(0, 0, 0, 0);

  const end = new Date(endUtc);
  end.setUTCMinutes(0, 0, 0, 0);

  let hourIndex = initialHourIndex;
  // Inject anomalies in the last 7 days (out of ~2160 hours)
  const anomalyHoursOffset = [2060, 2112, 2155];

  while (current <= end) {
    // 1. Determine IST time parts for the given UTC timestamp
    // We can use Intl.DateTimeFormat but it's easier to manually offset by +5:30 for hour/day extraction
    // IST = UTC + 5:30 (19800000 ms)
    const istMs = current.getTime() + 19800000;
    const istDate = new Date(istMs);
    
    const hour = istDate.getUTCHours();
    const dayOfWeek = istDate.getUTCDay(); // 0 = Sun, 6 = Sat
    const month = istDate.getUTCMonth();

    // 2. Base Load & Multipliers
    const base = BASE_LOAD[unitType] * baseLoadMultiplier;
    const hMult = HOURLY_MULT[unitType][hour];
    
    const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
    const wFactor = isWeekend ? WEEKEND_FACTOR[unitType].weekend : WEEKEND_FACTOR[unitType].weekday;
    
    const sFactor = seasonalFactor(month, unitType);

    // 3. Noise (±7.5%)
    const noise = (rng() - 0.5) * 0.15;

    // Calculate normal usage
    let kwh = base * hMult * wFactor * sFactor * (1 + noise);
    let isAnomaly = false;

    // 4. Anomaly Injection
    if (anomalyHoursOffset.includes(hourIndex)) {
      isAnomaly = true;
      kwh = kwh * (2.5 + rng() * 1.5);
    }

    // Keep it reasonable
    kwh = Math.max(0, kwh);
    
    results.push({
      timestamp: new Date(current), // clone
      kwh: Number(kwh.toFixed(3)),
      isAnomaly,
      source,
    });

    // Advance 1 hour
    current.setTime(current.getTime() + 3600000);
    hourIndex++;
  }

  return results;
}
