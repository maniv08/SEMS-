# Intelligence: Prediction, Anomaly Detection & Recommendations
# Smart Energy Management System

**Version**: 1.0  
**Read before**: Stage 4

---

## Why Statistical Methods, Not ML

For a student MVP:

| Criterion | Statistical (this project) | ML (e.g. LSTM) |
|-----------|---------------------------|----------------|
| Training data needed | 30–90 days (available) | 1–3 years ideally |
| Inference time | < 50 ms in Node.js | Requires Python runtime |
| Explainability | Full — every prediction step can be explained | Black box |
| Viva defensibility | High — formulas are in this doc | Low without deep knowledge |
| Accuracy on 90 days | Acceptable (MAE ~10–15%) | Marginal improvement, high variance |
| Stack compliance | Yes (Node.js only) | No (Python required) |

**Justification**: With 90 days of hourly data and a clear weekly-seasonal pattern,
a seasonal-naïve model augmented with a moving average provides a competitive baseline.
Academic papers (Hyndman & Athanasopoulos, *Forecasting: P&P*) confirm that for
structured periodic data with limited history, seasonal-naïve often outperforms complex
models. ML adds stack complexity without a meaningful accuracy gain at this scale.

---

## 1. Prediction: 7-Day Hourly Forecast

### Algorithm: Seasonal-Naïve + Moving Average (SNMA)

**Step 1 — Hour-of-week profile** (168 cells, last 30 days)

```
profile[dow][h] = mean(kwh WHERE dayOfWeek=dow AND hour=h)
  over the 30 days BEFORE the holdout period
```

**Step 2 — Moving average correction factor**

For each day `d` in the training set (day −37 to −8, excluding holdout):
```
actual_daily = Σ kwh for day d
naive_daily  = Σ profile[dow_of_d][h] for h in 0..23
ratio[d] = actual_daily / naive_daily   (skip if naive_daily = 0)
MA_factor = mean(ratio[d] for d in last 14 training days)
```

**Step 3 — Forecast**

For each future hour `(dow_f, h_f)` in the next 7 days:
```
predicted_kwh = profile[dow_f][h_f] × MA_factor
```

**Step 4 — Uncertainty band** (simple ±1 std-dev of ratio variation)
```
ratio_stddev = stddev(ratio[d] for d in training)
lower = predicted_kwh × (MA_factor - ratio_stddev) / MA_factor
upper = predicted_kwh × (MA_factor + ratio_stddev) / MA_factor
```
(bounds clamped to ≥ 0)

### Accuracy Evaluation (Holdout)

The last 7 days before today are withheld. SNMA is applied to the data before that period
and compared against the holdout:

```
MAE  = mean(|predicted_h - actual_h|)  for all hours h in holdout
MAPE = mean(|predicted_h - actual_h| / actual_h × 100)
       (skip hours where actual_h = 0 to avoid division by zero)
```

Both are returned in the API response alongside the forecast.

### Edge Cases

- Fewer than 14 days of data: use all available data; set `MA_factor = 1.0`
  (pure seasonal-naïve). API response includes `"note": "Limited data — accuracy may be low"`.
- Fewer than 7 days: no forecast returned; API returns 422 with message.

---

## 2. Anomaly Detection: Z-Score on Hour-of-Week Profile

### Algorithm

Computed on ingest (real-time) and also available as a batch check.

```
profile[dow][h] = { mean, stddev }  (last 30 days, excluding current record)
dow = isoDayOfWeek(timestamp, 'Asia/Kolkata') - 1   // 0=Mon
h   = hour(timestamp, 'Asia/Kolkata')

if profile[dow][h].stddev = 0 OR count_of_samples < 5:
  isAnomaly = (kwh > profile[dow][h].mean × 2.0)
  anomalyScore = null
else:
  z = (kwh - profile[dow][h].mean) / profile[dow][h].stddev
  isAnomaly = (|z| > 3.0)
  anomalyScore = z
```

**Threshold 3.0**: Under a normal distribution, |z| > 3 occurs in < 0.27% of readings.
With hourly data this equates to ~2–3 natural extremes per year — a low false-positive rate
suitable for alerts.

### What triggers an anomaly alert?

An anomaly alert (`type: "anomaly"`) is created when:
1. `isAnomaly = true` on a new reading, AND
2. No anomaly alert exists for the same unit on the same IST calendar day (deduplication).

---

## 3. Recommendations: Rule Engine

Recommendations are computed on demand (not stored). They are evaluated using the last
30 days of data for the user's units.

Each rule returns: `{ ruleId, priority, title, description, estimatedSavingKwh, estimatedSavingRs }`.
Rules are sorted by `priority` (1 = highest). Only triggered rules are returned.

---

### Rule R1 — HIGH_EVENING_PEAK

**Trigger**: The share of daily energy consumed between 18:00–22:00 IST exceeds **35%**
of total daily consumption (averaged over the last 14 days).

**Calculation**
```
evening_share = mean_daily_evening_kwh / mean_daily_total_kwh × 100
triggered = (evening_share > 35)
```

**Estimated saving**
```
target_share = 25%  (realistic shift to pre-cooling before 18:00)
reducible_kwh_per_day = mean_daily_total_kwh × (evening_share - target_share) / 100 × 0.5
  // 0.5 = assume 50% of the reducible share can be shifted, not eliminated
monthly_saving_kwh = reducible_kwh_per_day × 30
estimated_saving_rs = computeCost(monthly_kwh_so_far) - computeCost(monthly_kwh_so_far - monthly_saving_kwh)
```

**Priority**: 2  
**Example message**: "Your units use 41% of daily energy between 18:00–22:00. Shifting
appliances (washing machine, dishwasher) by 2 hours could save ~12 kWh/month (₹60)."

---

### Rule R2 — MONTH_OVER_MONTH_RISE

**Trigger**: Current month's projected total kWh > previous completed month's total
by more than **15%**.

**Calculation**
```
prev_month_kwh = monthly_kwh(unit, prev_month)
projected_current = (daily_avg_so_far × days_in_month)
rise_pct = (projected_current - prev_month_kwh) / prev_month_kwh × 100
triggered = (rise_pct > 15) AND (prev_month_kwh > 0) AND (days_elapsed >= 7)
  // require 7+ days to avoid noise in early-month projections
```

**Estimated saving**
```
excess_kwh = projected_current - prev_month_kwh
estimated_saving_kwh = excess_kwh × 0.7   // assume 70% of excess is reducible
estimated_saving_rs = computeCost(projected_current) - computeCost(projected_current - estimated_saving_kwh)
```

**Priority**: 1 (highest — spending trending up is urgent)  
**Example message**: "Your projected usage this month (420 kWh) is 22% higher than last month
(344 kWh). Checking for running appliances could save ~53 kWh (₹265)."

---

### Rule R3 — REPEATED_ANOMALIES

**Trigger**: 3 or more anomaly alerts exist for a unit in the last 7 IST calendar days.

**Calculation**
```
recent_anomaly_count = count(alerts WHERE type="anomaly" AND dayKey in last 7 days)
triggered = (recent_anomaly_count >= 3)
```

**Estimated saving**
```
anomaly_records = energyRecords WHERE isAnomaly=true AND last 7 days
avg_normal_for_those_hours = mean(profile[dow][h]) for the same hours
excess_per_anomaly = mean(anomaly_kwh - avg_normal)
monthly_saving_kwh = excess_per_anomaly × 3 × 4   // 3/week × 4 weeks
estimated_saving_rs = computeCost(monthly_kwh_so_far) - computeCost(monthly_kwh_so_far - monthly_saving_kwh)
```

**Priority**: 1 (tied — equipment fault suspected)  
**Example message**: "Flat 3B has had 4 anomalous readings in the last 7 days. This may
indicate a faulty appliance consuming ~3× normal power. Checking could save ~18 kWh (₹90)."

---

### Rule R4 — USAGE_ABOVE_80_PCT

**Trigger**: Month-to-date usage has exceeded **80%** of `monthlyLimitKwh`.

**Calculation**
```
usage_pct = (monthly_kwh_so_far / monthlyLimitKwh) × 100
triggered = (usage_pct >= 80) AND (days_remaining > 0)
```

**Estimated saving**
```
safe_budget_remaining = monthlyLimitKwh × 0.80 - monthly_kwh_so_far
  // how much is left before reaching the 80% "safe zone" line
// Note: this rule is informational — estimated saving is 0 (no formula for saving, just alert)
estimated_saving_kwh = 0
estimated_saving_rs = 0
```

**Priority**: 2  
**Example message**: "Flat 3B has used 252 kWh (84%) of its 300 kWh monthly limit with
29 days remaining. At this rate, you'll exceed the limit by 150 kWh."

---

### Rule R5 — HIGH_NIGHT_USAGE

**Trigger**: Average share of daily energy consumed between **00:00–05:00 IST** exceeds
**25%** of total daily consumption (averaged over the last 14 days).

**Calculation**
```
night_share = mean_daily_night_kwh / mean_daily_total_kwh × 100
triggered = (night_share > 25)
```

**Estimated saving**
```
target_share = 15%
reducible_kwh_per_day = mean_daily_total_kwh × (night_share - target_share) / 100 × 0.6
monthly_saving_kwh = reducible_kwh_per_day × 30
estimated_saving_rs = computeCost(monthly_kwh_so_far) - computeCost(monthly_kwh_so_far - monthly_saving_kwh)
```

**Priority**: 3  
**Example message**: "28% of your energy is used between midnight and 5 AM. Checking for
devices left on standby (water heaters, ACs on timer) could save ~8 kWh/month (₹40)."

---

## 4. Recommendation Display Order

1. Sort by `priority` ascending (1 first).
2. For ties, sort by `estimatedSavingRs` descending.
3. Dashboard shows only the top 1 (highest-priority triggered rule).
4. Recommendations page shows all triggered rules (max 5).
