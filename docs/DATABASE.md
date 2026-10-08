# Database Design
# Smart Energy Management System

**Version**: 1.0  
**Read before**: Stage 1, 2, 3

---

## Design Principles

1. **UTC everywhere in DB** — IST conversion happens only in aggregation pipelines and the
   frontend formatter. This avoids DST bugs and makes the data portable.
2. **Hourly granularity** — Each record represents energy consumed *in that hour* (kWh).
   This is not a cumulative meter counter. The choice enables hour-of-day and hour-of-week
   analytics without expensive diff calculations.
3. **No derived storage** — cost, usage percentage, and recommendations are always computed
   from current tariff/limit settings. Stored computed values go stale and cause
   inconsistency bugs.
4. **Indexes for aggregation first** — The most expensive queries are `$match + $group` on
   `energyRecords`. Compound indexes on `{unit, timestamp}` and `{building, timestamp}`
   ensure MongoDB uses an index scan, not a collection scan.

---

## Collections

---

### 1. `users`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `_id` | ObjectId | auto | |
| `name` | String | ✅ | Trimmed, 2–100 chars |
| `email` | String | ✅ | Lowercase, unique |
| `passwordHash` | String | ✅ | bcrypt, cost 12. Never returned in API responses. |
| `role` | String | ✅ | `"user"` or `"admin"`. Always `"user"` from public register. |
| `isActive` | Boolean | ✅ | Default `true`. Admin can set `false` to soft-delete. |
| `createdAt` | Date | auto | Mongoose timestamps |
| `updatedAt` | Date | auto | Mongoose timestamps |

**Indexes**
- `{ email: 1 }` — unique index (enforced at schema level).

**Validation rules**
- `email` must match RFC-5321 email regex.
- `password` (at registration, not stored): min 8 chars, ≥1 uppercase, ≥1 digit.

**Relationships**
- One User → many Units (via `units.owner`).
- One User → many Alerts (via `alerts.user`).

---

### 2. `buildings`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `_id` | ObjectId | auto | |
| `name` | String | ✅ | Trimmed, 2–100 chars, unique within system |
| `address` | String | ✅ | Free text, max 300 chars |
| `createdBy` | ObjectId (ref: User) | ✅ | Admin who created it |
| `createdAt` | Date | auto | |
| `updatedAt` | Date | auto | |

**Indexes**
- `{ name: 1 }` — unique.

**Relationships**
- One Building → many Units.

---

### 3. `units`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `_id` | ObjectId | auto | |
| `name` | String | ✅ | e.g. "Flat 3B", 2–100 chars |
| `building` | ObjectId (ref: Building) | ✅ | |
| `owner` | ObjectId (ref: User) | ✅ | |
| `unitType` | String | ✅ | `"residential"` \| `"commercial"` \| `"common_area"` |
| `monthlyLimitKwh` | Number | ✅ | Default from `settings.defaultMonthlyLimitKwh`. Min 10. |
| `deviceKey` | String | optional | SHA-256 hash of the plain device key. Plain key printed once at creation and never stored. |
| `isActive` | Boolean | ✅ | Default `true` |
| `createdAt` | Date | auto | |
| `updatedAt` | Date | auto | |

**Indexes**
- `{ building: 1 }` — for building-level queries.
- `{ owner: 1 }` — for user's units list.
- `{ deviceKey: 1 }` — sparse, for ingest auth lookup.

**Relationships**
- Belongs to one Building.
- Has one owner (User).
- Has many EnergyRecords.
- Has many Alerts.

---

### 4. `energyRecords`

This is the highest-volume collection. 10 units × 24 hours × 90 days = 21,600 records
for the seed dataset. With the live ticker it grows by 10 records/hour.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `_id` | ObjectId | auto | |
| `unit` | ObjectId (ref: Unit) | ✅ | |
| `building` | ObjectId (ref: Building) | ✅ | Denormalised for building-level aggregation without a join |
| `owner` | ObjectId (ref: User) | ✅ | Denormalised for fast ownership filtering |
| `timestamp` | Date | ✅ | UTC. Truncated to the start of the hour (e.g. 14:00:00.000Z). |
| `kwh` | Number | ✅ | Energy consumed in this one hour. Min 0, no upper hard limit (anomalies are detected later). |
| `isAnomaly` | Boolean | ✅ | Default `false`. Set by the anomaly detector on ingest. |
| `anomalyScore` | Number | optional | z-score at time of ingest. Stored for debugging. |
| `source` | String | ✅ | `"simulator"` \| `"seed"` \| `"device"` \| `"csv_import"` |
| `createdAt` | Date | auto | |

**Indexes** (critical for performance)
```js
// Primary analytics index — unit time-series
{ unit: 1, timestamp: -1 }  // unique: true

// Building-level aggregation (admin dashboard)
{ building: 1, timestamp: -1 }

// Owner-scoped queries
{ owner: 1, timestamp: -1 }

// Anomaly filtering
{ isAnomaly: 1, timestamp: -1 }
```

**Unique compound index**: `{ unit: 1, timestamp: 1 }` — enforces idempotency on ingest.
Any attempt to insert a duplicate (unit + hour) results in a Mongo duplicate key error,
which the ingest handler catches and returns the existing record with HTTP 200.

**Why hourly granularity?**
- Coarser (daily): loses hour-of-day patterns needed for evening-peak detection.
- Finer (per-minute): 10 units × 1440 min/day × 90 days = 1.3 million records from seed
  alone — impractical for a student project on M0 Atlas.
- Hourly is the standard granularity for residential smart meters (DLMS/COSEM standard).

**Why UTC?**
- IST is UTC+5:30 with no DST changes, but storing UTC is a universal best practice.
- MongoDB `$dateTrunc` and `$dateToString` accept a timezone parameter, so IST grouping
  is handled in the aggregation pipeline without any application-level conversion.

---

### 5. `alerts`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `_id` | ObjectId | auto | |
| `unit` | ObjectId (ref: Unit) | ✅ | |
| `owner` | ObjectId (ref: User) | ✅ | Denormalised for fast lookup |
| `building` | ObjectId (ref: Building) | ✅ | Denormalised |
| `type` | String | ✅ | `"limit_80"` \| `"limit_100"` \| `"anomaly"` |
| `status` | String | ✅ | `"open"` \| `"read"`. Default `"open"`. |
| `message` | String | ✅ | Human-readable description |
| `relatedRecord` | ObjectId (ref: EnergyRecord) | optional | For anomaly alerts |
| `period` | String | optional | For limit alerts: `"2026-10"` (YYYY-MM). Used for deduplication. |
| `dayKey` | String | optional | For anomaly alerts: `"2026-10-02"` (YYYY-MM-DD IST). Used for deduplication. |
| `createdAt` | Date | auto | |
| `updatedAt` | Date | auto | |

**Indexes**
- `{ owner: 1, status: 1, createdAt: -1 }` — user alerts feed.
- `{ unit: 1, type: 1, period: 1 }` — dedup check for limit alerts (sparse on period).
- `{ unit: 1, type: 1, dayKey: 1 }` — dedup check for anomaly alerts.

**Deduplication logic**
- **Limit alert (80%/100%)**: before inserting, check `{ unit, type, period }`. If an
  open alert with that combination exists, skip creation.
- **Anomaly alert**: before inserting, check `{ unit, type: "anomaly", dayKey }`. If one
  exists for today (IST), skip creation.

---

### 6. `settings`

Single-document singleton. Only one document exists. Managed by admin.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `_id` | ObjectId | auto | |
| `defaultMonthlyLimitKwh` | Number | ✅ | Default 300. Applied to new units. |
| `tariffSlabs` | Array of TariffSlab | ✅ | See sub-schema below |
| `currencySymbol` | String | ✅ | Default `"₹"` |
| `updatedBy` | ObjectId (ref: User) | ✅ | Admin who last updated |
| `updatedAt` | Date | auto | |

**TariffSlab sub-schema**

| Field | Type | Notes |
|-------|------|-------|
| `upToKwh` | Number | Upper boundary of this slab. `Infinity` (stored as `null`) for the last slab. |
| `ratePerKwh` | Number | ₹ per kWh for units consumed *within* this slab |

**Default tariff (Indian EB approximate)**
```json
[
  { "upToKwh": 100,  "ratePerKwh": 2.50 },
  { "upToKwh": 200,  "ratePerKwh": 3.25 },
  { "upToKwh": 500,  "ratePerKwh": 5.00 },
  { "upToKwh": null, "ratePerKwh": 6.50 }
]
```
The last slab with `upToKwh: null` is treated as "above all previous slabs".

---

## Data Flow Diagram (text)

```
User Register/Login
       │
       ▼
  users collection
       │ owns
       ▼
  units collection ──────── belongs to ──────► buildings collection
       │
       │ has many
       ▼
energyRecords collection ──► alerts collection (generated by analytics/ticker)
       │
       └──► analytics queries (aggregation pipelines, not stored)
       └──► predictions (computed on demand, not stored)
       └──► recommendations (computed on demand, not stored)
       └──► reports / CSV (generated on demand, not stored)
```

---

## Large Dataset Strategy

With 10 units and 90 days: ~21,600 documents in `energyRecords`.
With SIMULATOR_ENABLED over 1 year: ~87,600 documents.

- All aggregation queries `$match` on `{ unit: <id>, timestamp: { $gte, $lte } }` first,
  hitting the `{ unit: 1, timestamp: -1 }` index.
- For admin building-level: `$match { building: <id>, timestamp: ... }` hits the
  `{ building: 1, timestamp: -1 }` index.
- `$group` uses `$dateTrunc` with `timezone: "Asia/Kolkata"` — runs inside Mongo, not JS.
- Projection limits returned fields to only those needed.
- Analytics results for full-month views are computed fresh per request (no Redis cache in
  MVP — acceptable given the small dataset size and the 2s NFR is met with indexes).
