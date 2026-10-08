# Simulator Design
# Smart Energy Management System

**Version**: 1.0  
**Read before**: Stage 3

---

## Design Goals

1. **Deterministic**: given the same `seed` and `unitId`, the function always produces
   identical output. The seed is derived from the unit's `_id` string to keep it consistent
   across seed runs.
2. **Realistic curve**: matches real residential/commercial consumption patterns
   (morning ramp, afternoon lull, evening peak, night low).
3. **Pure function**: no side effects. The function takes parameters and returns an array
   of `{ timestamp, kwh }` objects. The database write is a separate concern.
4. **Configurable**: unit type (residential/commercial/common_area) and weekday/weekend
   factors are parameters, not hardcoded.

---

## Seeded RNG

We use a Mulberry32 PRNG (32-bit, simple, fast, no external dependencies):

```js
// backend/src/utils/rng.js
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
```

Seed derivation from `unitId` (ObjectId string):
```js
const seed = parseInt(unitId.slice(-8), 16);  // last 4 bytes of ObjectId as uint32
```

This ensures each unit gets a different but deterministic seed.

---

## Base Load by Unit Type

| Unit Type | Base Load (kWh/hour) | Description |
|-----------|----------------------|-------------|
| `residential` | 0.30 | Average Indian flat off-peak |
| `commercial` | 0.65 | Small office off-peak |
| `common_area` | 0.20 | Corridor lights, pumps |

---

## Hourly Profile Multipliers

These multipliers are applied to the base load. They model a typical IST day.

| Hour IST | Residential | Commercial | Common Area |
|----------|-------------|------------|-------------|
| 00 | 0.45 | 0.20 | 0.35 |
| 01 | 0.35 | 0.15 | 0.30 |
| 02 | 0.30 | 0.15 | 0.30 |
| 03 | 0.30 | 0.15 | 0.30 |
| 04 | 0.35 | 0.15 | 0.30 |
| 05 | 0.50 | 0.20 | 0.40 |
| 06 | 0.80 | 0.25 | 0.55 |
| 07 | 1.20 | 0.30 | 0.70 |
| 08 | 1.50 | 0.80 | 0.80 |
| 09 | 1.30 | 1.40 | 0.75 |
| 10 | 1.10 | 1.60 | 0.70 |
| 11 | 1.00 | 1.70 | 0.65 |
| 12 | 1.10 | 1.60 | 0.65 |
| 13 | 1.15 | 1.50 | 0.65 |
| 14 | 1.00 | 1.60 | 0.65 |
| 15 | 0.95 | 1.65 | 0.65 |
| 16 | 1.00 | 1.55 | 0.70 |
| 17 | 1.20 | 1.20 | 0.75 |
| 18 | 1.80 | 0.60 | 0.90 |
| 19 | 2.20 | 0.40 | 1.00 |
| 20 | 2.10 | 0.30 | 0.95 |
| 21 | 1.90 | 0.25 | 0.90 |
| 22 | 1.40 | 0.20 | 0.75 |
| 23 | 0.80 | 0.20 | 0.55 |

Evening peak 18:00–22:00 is 1.8–2.2× the base load for residential (matches real
Indian household data: cooking, TV, AC, lighting all peak together).

---

## Weekday / Weekend Factor

| Unit Type | Weekday | Weekend |
|-----------|---------|---------|
| `residential` | 1.00 | 1.15 |
| `commercial` | 1.00 | 0.35 |
| `common_area` | 1.00 | 0.90 |

---

## Seasonal Factor

India has three main seasons. We use a simple sinusoidal approximation.

```js
// month is 0-indexed (0=Jan, 11=Dec)
function seasonalFactor(month, unitType) {
  // Summer (Mar–Jun): AC usage peaks → higher residential
  // Winter (Nov–Feb): heater/geyser → slightly higher
  // Monsoon (Jul–Sep): mild
  const SEASONAL = {
    residential: [1.05, 1.00, 1.15, 1.30, 1.40, 1.35, 1.10, 1.05, 1.00, 1.05, 1.10, 1.10],
    commercial:  [1.00, 1.00, 1.05, 1.15, 1.20, 1.15, 1.05, 1.00, 1.00, 1.00, 1.00, 1.00],
    common_area: [1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00],
  };
  return SEASONAL[unitType][month];
}
```

---

## Noise

A seeded random noise term is added per reading:
```
noise = (rng() - 0.5) × 0.15   // ±7.5% uniform noise
```

The `rng()` call is sequential — each call advances the RNG state, so every hour gets a
unique noise value while remaining deterministic.

---

## Anomaly Injection

Every unit gets anomalies injected at predetermined offsets. Anomalies are spikes (2–4×
normal value) to simulate appliance faults, forgotten AC, etc.

```js
// anomalyOffset is derived from the unit seed (not the hour RNG)
const anomalyHoursOffset = [72, 312, 840]; // hours from start of 90-day window
// Each anomaly: kwh × (2.5 + rng() × 1.5)   → 2.5× to 4× spike
```

At least one anomaly is injected in the last 30 days to ensure the alert system has data
to detect on fresh seed.

The demo user's Unit 1 is configured so that month-to-date consumption reaches ~83% of
its `monthlyLimitKwh` by the current date (achieved by giving it a higher base load or
lower limit).

---

## Generator Function Signature

```js
// backend/src/simulator/generator.js

/**
 * Generate hourly energy readings for one unit over a date range.
 * PURE FUNCTION — no side effects, no DB access.
 *
 * @param {object} params
 * @param {string} params.unitId        - MongoDB ObjectId string (used as RNG seed)
 * @param {string} params.unitType      - "residential" | "commercial" | "common_area"
 * @param {Date}   params.startUtc      - inclusive start (truncated to hour)
 * @param {Date}   params.endUtc        - inclusive end (truncated to hour)
 * @returns {{ timestamp: Date, kwh: number, source: "seed" | "simulator" }[]}
 */
export function generateReadings({ unitId, unitType, startUtc, endUtc }) { ... }
```

---

## Simulator Ticker

The ticker is activated when `SIMULATOR_ENABLED=true` in `.env`.

```js
// backend/src/simulator/ticker.js
// Runs every hour at :00 (via node-cron: '0 * * * *')
// For each active unit:
//   1. Compute the current hour's reading using generateReadings(now)
//   2. POST to the internal ingest function (not HTTP — direct function call)
//   3. Trigger alert check
```

The ticker logs "Simulator tick: appended N readings" to morgan.

---

## Verification (used in Stage 3 gate)

After seeding, the following must hold:
1. `energyRecords.count()` = (number of units) × (number of hours in 90 days) = 10 × 2160 = 21,600.
2. For every unit, average kWh from 19:00–21:00 IST > average kWh from 01:00–04:00 IST.
3. For residential units, average weekend daily total ≥ average weekday daily total × 1.10.
4. At least 3 anomaly records exist per unit (`isAnomaly: true`).
5. Running seed twice: `energyRecords.count()` remains 21,600 (idempotency).
