# Analytics Formulas
# Smart Energy Management System

**Version**: 1.0  
**Read before**: Stage 4

All formulas run inside MongoDB aggregation pipelines unless stated otherwise.
All grouping uses `timezone: "Asia/Kolkata"` in `$dateTrunc` / `$dateToString`.

---

## 1. Daily Consumption

**Definition**: Sum of all `kwh` values in `energyRecords` for a given unit and calendar
day in IST.

**Formula**
```
daily_kwh(unit, date_ist) = Σ record.kwh
  WHERE record.unit = unit
    AND dateTrunc(record.timestamp, 'day', 'Asia/Kolkata') = date_ist
```

**Worked example**  
Unit: Flat 3B, Date: 2026-10-02 IST  
Records at hours 00–23 IST (stored as 18:30 prev day UTC to 18:30 today UTC):

| Hour IST | kWh |
|----------|-----|
| 00:00 | 0.20 |
| 01:00 | 0.18 |
| ... | ... |
| 19:00 | 2.10 |
| 20:00 | 1.95 |
| ... | ... |
| 23:00 | 0.30 |

Sum = 15.40 kWh → `daily_kwh = 15.40`

**MongoDB aggregation snippet**
```js
{ $match: { unit: unitObjectId, timestamp: { $gte: dayStartUtc, $lte: dayEndUtc } } },
{ $group: {
    _id: { $dateTrunc: { date: "$timestamp", unit: "day", timezone: "Asia/Kolkata" } },
    totalKwh: { $sum: "$kwh" }
}}
```

---

## 2. Weekly Consumption

**Definition**: Sum of daily totals for the ISO week (Monday–Sunday) in IST containing
the given date.

**Formula**
```
weekly_kwh(unit, week_monday_ist) = Σ daily_kwh(unit, d)
  FOR d IN [week_monday_ist, ..., week_monday_ist + 6 days]
```

**Worked example**  
Week of 2026-09-28 (Mon) to 2026-10-04 (Sun):

| Day | kWh |
|-----|-----|
| Mon 28 | 14.2 |
| Tue 29 | 15.8 |
| Wed 30 | 13.5 |
| Thu 01 | 16.1 |
| Fri 02 | 15.4 |
| Sat 03 | 10.3 |
| Sun 04 | 9.8 |

`weekly_kwh = 95.1`

---

## 3. Monthly Consumption

**Definition**: Sum of all `kwh` for a unit in a calendar month (IST).

**Formula**
```
monthly_kwh(unit, year, month) = Σ record.kwh
  WHERE record.unit = unit
    AND dateToString(record.timestamp, '%Y-%m', 'Asia/Kolkata') = '{year}-{month}'
```

**Worked example**  
Unit: Flat 3B, Month: 2026-10  
1 day recorded so far (2 Oct): 15.40 kWh  
`monthly_kwh = 15.40` (partial month)

---

## 4. Average Hourly Consumption

**Definition**: Mean kWh across all hourly records in a period.

**Formula**
```
avg_hourly_kwh(unit, from, to) = monthly_kwh(unit, from, to) / count_of_records(unit, from, to)
```

**Edge case**: If `count = 0`, return `null` (not 0 or NaN). The API returns `null` and
the UI shows "No data".

---

## 5. Peak Hour

**Definition**: The hour-of-day with the highest *average* kWh over the selected period.

**Formula**
```
peak_hour(unit, from, to) = argmax over h in [0..23] of:
  avg(record.kwh WHERE hour_ist(record.timestamp) = h)
```

**Worked example**  
30-day average by hour (IST), top 3:

| Hour IST | Avg kWh |
|----------|---------|
| 19:00 | 1.85 |
| 20:00 | 1.72 |
| 08:00 | 1.20 |

`peak_hour = 19` (7 PM IST)

**MongoDB snippet**
```js
{ $group: {
    _id: { $hour: { date: "$timestamp", timezone: "Asia/Kolkata" } },
    avgKwh: { $avg: "$kwh" }
}},
{ $sort: { avgKwh: -1 } },
{ $limit: 1 }
```

---

## 6. Percentage Change

**Formula**
```
pct_change(current, previous) =
  if previous = 0 and current = 0 → 0
  if previous = 0 and current > 0 → null  (displayed as "N/A — new data")
  else → ((current - previous) / previous) × 100
```

**Worked examples**

| Current | Previous | Result |
|---------|----------|--------|
| 15.4 | 13.2 | +16.7% |
| 12.0 | 14.0 | −14.3% |
| 5.0 | 0.0 | null ("N/A") |
| 0.0 | 0.0 | 0% |

**Display**: positive = red (more consumption), negative = green (savings).  
Exception: on cost cards, same colour logic applies.

---

## 7. Slab-Based Estimated Cost

**Definition**: Apply Indian EB-style progressive tariff slabs to the total kWh for the
period.

**Tariff slabs (default)**

| Slab | Up to (kWh) | Rate (₹/kWh) |
|------|-------------|--------------|
| 1 | 100 | 2.50 |
| 2 | 200 | 3.25 |
| 3 | 500 | 5.00 |
| 4 | ∞ | 6.50 |

**Formula** (pure function, no DB write)
```
function computeCost(totalKwh, slabs):
  cost = 0
  remaining = totalKwh
  prevBoundary = 0

  for each slab in slabs (sorted by upToKwh, last has upToKwh = ∞):
    slabSize = (slab.upToKwh ?? ∞) - prevBoundary
    consumed = min(remaining, slabSize)
    cost += consumed × slab.ratePerKwh
    remaining -= consumed
    prevBoundary = slab.upToKwh ?? ∞
    if remaining <= 0: break

  return round(cost, 2)
```

**Worked example**: `totalKwh = 250`

| Slab | Units in slab | Rate | Cost |
|------|---------------|------|------|
| 1 (0–100) | 100 | 2.50 | 250.00 |
| 2 (101–200) | 100 | 3.25 | 325.00 |
| 3 (201–500) | 50 | 5.00 | 250.00 |
| **Total** | | | **₹825.00** |

---

## 8. Usage vs Threshold Percentage

**Formula**
```
usage_pct(unit, year, month) = (monthly_kwh / unit.monthlyLimitKwh) × 100
```

**Display thresholds**
- < 80%: green (ProgressGauge green zone)
- 80–100%: amber (warning)
- > 100%: red (critical)

**Worked example**  
`monthly_kwh = 252`, `monthlyLimitKwh = 300`  
`usage_pct = (252 / 300) × 100 = 84.0%` → amber

---

## 9. Month-End Projection

**Definition**: Estimate total kWh if current consumption rate continues for the rest of
the month.

**Formula**
```
days_elapsed = (today_ist - month_start_ist).days + 1
  (minimum 1 to avoid division by zero)
daily_avg = monthly_kwh_so_far / days_elapsed
days_in_month = number of days in current IST month
projected = daily_avg × days_in_month
```

**Edge case**: if `days_elapsed = 0` (should not happen; guarded with max(1, days_elapsed)),
return `null`.

**Worked example**  
Date: 2026-10-02, month start: 2026-10-01, `days_elapsed = 2`  
`monthly_kwh_so_far = 30.80`  
`daily_avg = 30.80 / 2 = 15.40`  
`days_in_month = 31`  
`projected = 15.40 × 31 = 477.4 kWh`  
`projected_cost = computeCost(477.4)` using current slabs.

The UI labels the estimated bill "Projected" when `days_elapsed < days_in_month`.

---

## 10. Today vs Same Weekday Last Week

**Formula**
```
same_weekday_last_week_kwh = daily_kwh(unit, today_ist − 7 days)
pct_change = pct_change(today_kwh, same_weekday_last_week_kwh)
```

Handles the edge case where the unit was created less than 7 days ago: return `null`.

---

## 11. Hour-of-Week Profile (used by anomaly detection and forecast)

**Definition**: For each (day_of_week, hour_of_day) cell — 7 × 24 = 168 cells — compute
the mean and standard deviation of all historical readings that fall in that cell.

**Formula**
```
profile[dow][h] = {
  mean: avg(record.kwh WHERE dayOfWeek(record.timestamp, 'Asia/Kolkata') = dow
                          AND hour(record.timestamp, 'Asia/Kolkata') = h),
  stddev: stdDevPop(same filter)
}
```

`dow` 0 = Monday, 6 = Sunday (consistent with `$isoDayOfWeek - 1`).

This profile is computed over the last 30 days of data (or all data if fewer than 30 days).

---

## 12. Anomaly Score (z-score)

**Formula**
```
z = (record.kwh − profile[dow][h].mean) / profile[dow][h].stddev
isAnomaly = |z| > 3
```

**Edge cases**
- If `stddev = 0` (all historical readings in that cell are identical), skip z-score check
  (cannot divide by zero). Flag as anomaly only if `kwh > mean × 2`.
- If fewer than 5 data points exist for that cell, skip anomaly detection (insufficient data).

---

## 13. Formatter (shared utility — one implementation, reused everywhere)

```js
// /frontend/src/utils/formatters.js  AND  /backend/src/utils/formatters.js (same logic)

formatKwh(value, decimals = 2) → `${value.toFixed(decimals)} kWh`
formatRupees(value) → `₹${value.toFixed(2)}`
formatPct(value, decimals = 1) → `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`
formatDateIST(utcDate, format) → uses Intl.DateTimeFormat with timeZone 'Asia/Kolkata'
```

Numbers displayed in UI always use CSS `font-variant-numeric: tabular-nums`.
