# API Contract
# Smart Energy Management System

**Version**: 1.0  
**Base URL**: `/api/v1`  
**Read before**: Stage 2, 3, 4, 5, 6, 7

---

## Conventions

### Authentication
- Protected routes require: `Authorization: Bearer <jwt>`
- Device ingest route requires: `x-device-key: <plain-device-key>` header instead of JWT.

### Response Envelope

**Success**
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional human-readable message"
}
```

**Error**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable summary",
    "details": [ { "field": "email", "message": "Invalid email format" } ]
  }
}
```

### Error Codes

| Code | HTTP Status | Meaning |
|------|-------------|---------|
| `VALIDATION_ERROR` | 400 | Zod schema violation |
| `UNAUTHORIZED` | 401 | Missing or invalid JWT |
| `FORBIDDEN` | 403 | Authenticated but insufficient role/ownership |
| `NOT_FOUND` | 404 | Resource does not exist |
| `CONFLICT` | 409 | Duplicate resource (e.g. email already exists) |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

### Pagination (all list endpoints)
Query params: `?page=1&limit=20`  
Response data shape for lists:
```json
{
  "items": [ ... ],
  "pagination": {
    "total": 47,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

---

## 1. Authentication — `/api/v1/auth`

### POST `/api/v1/auth/register`
Register a new user. Role is always set to `"user"` regardless of request body.

**Auth**: None  
**Rate limit**: 10 req/15min per IP

**Request body**
```json
{
  "name": "Ravi Kumar",
  "email": "ravi@example.com",
  "password": "Secret123"
}
```

**Validation**
- `name`: string, 2–100 chars, required
- `email`: valid email, required
- `password`: min 8 chars, ≥1 uppercase, ≥1 digit, required

**Success 201**
```json
{
  "success": true,
  "data": {
    "token": "<jwt>",
    "user": { "_id": "...", "name": "Ravi Kumar", "email": "ravi@example.com", "role": "user" }
  },
  "message": "Registration successful"
}
```

**Errors**
- 400 VALIDATION_ERROR — invalid fields
- 409 CONFLICT — email already registered

---

### POST `/api/v1/auth/login`
**Auth**: None  
**Rate limit**: 10 req/15min per IP

**Request body**
```json
{ "email": "ravi@example.com", "password": "Secret123" }
```

**Success 200**
```json
{
  "success": true,
  "data": {
    "token": "<jwt>",
    "user": { "_id": "...", "name": "Ravi Kumar", "email": "ravi@example.com", "role": "user" }
  }
}
```

**Errors**
- 400 VALIDATION_ERROR
- 401 UNAUTHORIZED — "Invalid credentials" (same message for wrong email OR wrong password — do not differentiate)

---

### GET `/api/v1/auth/me`
Return the currently authenticated user.

**Auth**: JWT required

**Success 200**
```json
{
  "success": true,
  "data": { "_id": "...", "name": "...", "email": "...", "role": "...", "isActive": true, "createdAt": "..." }
}
```

**Errors**: 401

---

### PUT `/api/v1/auth/change-password`
**Auth**: JWT required

**Request body**
```json
{ "currentPassword": "OldPass1", "newPassword": "NewPass2" }
```

**Validation**: same rules as registration password.

**Success 200** `{ "success": true, "message": "Password updated" }`

**Errors**
- 400 VALIDATION_ERROR
- 401 UNAUTHORIZED — wrong current password

---

## 2. Users — `/api/v1/users` (Admin only)

### GET `/api/v1/users`
**Auth**: JWT + role=admin  
**Query**: `?page=1&limit=20&search=<string>&isActive=true`

**Success 200** → paginated list of users (no `passwordHash`).

---

### GET `/api/v1/users/:id`
**Auth**: JWT + role=admin

**Success 200** → single user object.

**Errors**: 404

---

### PATCH `/api/v1/users/:id`
Admin can update `name`, `isActive`. Cannot change `email` or `role` via this endpoint.

**Auth**: JWT + role=admin

**Request body** (all optional)
```json
{ "name": "New Name", "isActive": false }
```

**Success 200** → updated user.

**Errors**: 400, 404

---

## 3. Buildings — `/api/v1/buildings`

### POST `/api/v1/buildings`
**Auth**: JWT + role=admin

**Request body**
```json
{ "name": "Sunrise Apartments", "address": "42 MG Road, Bengaluru 560001" }
```

**Validation**: `name` 2–100 chars, `address` 5–300 chars, both required.

**Success 201** → created building.

**Errors**: 400, 409 (name already exists)

---

### GET `/api/v1/buildings`
**Auth**: JWT (both roles)  
**Query**: `?page=1&limit=20`

Users get `_id` and `name` only (for unit creation dropdown).  
Admin gets all fields.

**Success 200** → paginated list.

---

### GET `/api/v1/buildings/:id`
**Auth**: JWT (both roles — user gets limited fields)

**Success 200** → building object.

**Errors**: 404

---

### PUT `/api/v1/buildings/:id`
**Auth**: JWT + role=admin

**Request body**: `{ "name": "...", "address": "..." }` (all optional)

**Success 200** → updated building.

**Errors**: 400, 404, 409

---

### DELETE `/api/v1/buildings/:id`
**Auth**: JWT + role=admin

Cannot delete a building that has active units. Returns 409 if units exist.

**Success 200** `{ "success": true, "message": "Building deleted" }`

**Errors**: 404, 409

---

## 4. Units — `/api/v1/units`

### POST `/api/v1/units`
**Auth**: JWT  
- User: `owner` is forced to their own `_id`.
- Admin: can specify any `owner`.

**Request body**
```json
{
  "name": "Flat 3B",
  "building": "<buildingId>",
  "unitType": "residential",
  "monthlyLimitKwh": 300,
  "owner": "<userId>"
}
```

**Validation**
- `name`: 2–100 chars, required
- `building`: valid ObjectId, must exist, required
- `unitType`: enum `["residential", "commercial", "common_area"]`, required
- `monthlyLimitKwh`: number ≥ 10, optional (defaults to `settings.defaultMonthlyLimitKwh`)
- `owner`: valid ObjectId, admin only (ignored/overridden for user role)

**Success 201** → created unit with `deviceKey` plain text in the response (only time it's shown).
```json
{
  "success": true,
  "data": {
    "unit": { "_id": "...", "name": "Flat 3B", ... },
    "deviceKeyPlain": "ek_abc123xyz"
  },
  "message": "Unit created. Save the device key — it will not be shown again."
}
```

**Errors**: 400, 403 (user trying to set owner to another user), 404 (building not found)

---

### GET `/api/v1/units`
**Auth**: JWT  
- User: returns only their own units.
- Admin: returns all units.

**Query**: `?page=1&limit=20&building=<id>&owner=<id>`

**Success 200** → paginated units (with building name populated).

---

### GET `/api/v1/units/:id`
**Auth**: JWT  
Ownership enforced: user can only read their own unit.

**Success 200** → unit with building and owner populated.

**Errors**: 403, 404

---

### PUT `/api/v1/units/:id`
**Auth**: JWT  
- User: can update `name` and `monthlyLimitKwh` only.
- Admin: can also update `building`, `owner`, `unitType`, `isActive`.

**Request body** (all optional, validated same as POST)

**Success 200** → updated unit.

**Errors**: 400, 403, 404

---

### DELETE `/api/v1/units/:id`
**Auth**: JWT + role=admin

Soft-deletes by setting `isActive: false`. Energy records are kept.

**Success 200** `{ "success": true, "message": "Unit deactivated" }`

**Errors**: 403, 404

---

### POST `/api/v1/units/:id/regenerate-key`
**Auth**: JWT  
Ownership enforced (or admin).

Generates a new `deviceKey`, invalidates the old one. Returns plain key once.

**Success 200** → `{ "deviceKeyPlain": "ek_newkey..." }`

---

## 5. Energy — `/api/v1/energy`

### POST `/api/v1/energy/ingest`
Accept one hourly reading. Used by simulator ticker, future ESP32 devices, and CSV import
intermediary. **Idempotent**: duplicate `(unit, timestamp)` returns HTTP 200 with the
existing record (not an error).

**Auth**: `x-device-key: <plain-key>` header (device auth, no JWT required).  
OR: JWT + role=admin (for admin manual ingest).

**Rate limit**: 60 req/min per device key.

**Request body**
```json
{
  "unitId": "<objectId>",
  "timestamp": "2026-10-02T14:00:00.000Z",
  "kwh": 1.42,
  "source": "device"
}
```

**Validation**
- `unitId`: valid ObjectId, must exist and be active
- `timestamp`: ISO-8601 UTC, must be truncated to the hour (minutes/seconds = 0)
- `kwh`: number ≥ 0, ≤ 100 (hard upper guard; anomaly detection handles outliers within range)
- `source`: enum `["simulator","seed","device","csv_import"]`

**Success 200** (existing or new)
```json
{
  "success": true,
  "data": { "_id": "...", "unit": "...", "timestamp": "...", "kwh": 1.42, "isAnomaly": false },
  "message": "Reading recorded"
}
```

**Errors**: 400 (validation), 401 (invalid device key), 404 (unit not found)

---

### GET `/api/v1/energy/history`
Paginated raw hourly records for a unit.

**Auth**: JWT  
Ownership enforced.

**Query**
```
?unitId=<id>&from=2026-09-01T00:00:00Z&to=2026-10-02T23:59:59Z&page=1&limit=100&anomalyOnly=false
```

**Success 200** → paginated energy records, ordered newest first.

---

### GET `/api/v1/energy/export`
Download history as CSV.

**Auth**: JWT  
Ownership enforced for users; admin can export any unit.

**Query**: same as `/history` minus pagination.

**Success 200**: `Content-Type: text/csv`, `Content-Disposition: attachment; filename="energy_<unitId>_<date>.csv"`

CSV columns: `timestamp_ist,kwh,is_anomaly,source`

---

### POST `/api/v1/admin/energy/import`
Bulk import energy records from a file (CSV, JSON, or Excel).

**Auth**: JWT + role=admin  
**Content-Type**: `multipart/form-data`  
**Body**: `file` (CSV, JSON, or Excel), `unitId` (form field)

Supported formats:
- **CSV**: Must have columns `timestamp_ist`, `kwh`, `is_anomaly`, `source` (header row required).
- **JSON**: Must be an array of objects with keys `timestamp_ist`, `kwh`, `is_anomaly`, `source`.
- **Excel**: First sheet must have columns `timestamp_ist`, `kwh`, `is_anomaly`, `source` (header row required).

Idempotent per record (uses the same upsert logic as ingest).

**Success 200**
```json
{
  "success": true,
  "data": { "inserted": 200, "skipped": 5 },
  "message": "Import complete"
}
```

**Errors**: 400 (invalid CSV), 404 (unit not found)

---

## 6. Analytics — `/api/v1/analytics`

All analytics run as MongoDB aggregations. No JS-level summing of records.  
All timestamps returned in IST (formatted strings) for display; raw ISO-8601 UTC also provided.

### GET `/api/v1/analytics/summary`
Top-level KPIs for the dashboard stat cards.

**Auth**: JWT  
**Query**: `?unitId=<id>` (optional; if omitted and user, returns aggregated across all user's units)

**Response data**
```json
{
  "todayKwh": 5.23,
  "todayVsLastWeekSameDayPct": 12.5,
  "monthKwh": 142.80,
  "monthVsLastMonthPct": -3.2,
  "estimatedBill": 621.50,
  "billIsProjected": true,
  "currentHourKwh": 0.87,
  "monthlyLimitKwh": 300,
  "monthUsagePct": 47.6,
  "daysRemainingInMonth": 29,
  "projectedMonthEndKwh": 300.5,
  "lastUpdated": "2026-10-02T20:00:00.000Z"
}
```

---

### GET `/api/v1/analytics/consumption`
Time-series for the main chart.

**Auth**: JWT  
**Query**
```
?unitId=<id>&period=day|week|month&date=2026-10-02
```
- `period=day`: returns 24 hourly data points for that IST calendar day.
- `period=week`: returns 7 daily totals for the ISO week containing `date`.
- `period=month`: returns daily totals for the calendar month of `date`.

**Response data**
```json
{
  "series": [
    { "label": "14:00", "kwh": 1.42, "timestamp": "2026-10-02T08:30:00.000Z" }
  ],
  "comparison": [ ... ],
  "total": 34.5,
  "unit": "kWh"
}
```
`comparison` is the same period one week ago (day), one week ago (week), or one month ago (month).

---

### GET `/api/v1/analytics/peak`
Peak analysis — highest-consumption hour in a given period.

**Auth**: JWT  
**Query**: `?unitId=<id>&from=<iso>&to=<iso>`

**Response data**
```json
{
  "peakHour": "19:00",
  "peakKwh": 2.14,
  "peakDate": "2026-10-01",
  "averageHourlyKwh": 0.62,
  "heatmapData": [
    { "dayOfWeek": 0, "hour": 0, "avgKwh": 0.21 },
    ...
  ]
}
```
`heatmapData`: 168 cells (7 × 24), `dayOfWeek` 0=Monday.

---

### GET `/api/v1/analytics/admin/overview`
System-wide totals for admin dashboard.

**Auth**: JWT + role=admin

**Response data**
```json
{
  "totalUnits": 10,
  "totalUsersActive": 5,
  "systemMonthKwh": 1420.5,
  "systemMonthCost": 6210.00,
  "openAlerts": 3,
  "topConsumers": [
    { "unitId": "...", "unitName": "Flat 1A", "ownerName": "...", "monthKwh": 210.5 }
  ]
}
```
`topConsumers`: top 5 units by month-to-date consumption.

---

## 7. Alerts — `/api/v1/alerts`

### GET `/api/v1/alerts`
**Auth**: JWT  
- User: own alerts only.
- Admin: all alerts, with `?unitId=` or `?owner=` filter.

**Query**: `?page=1&limit=20&status=open|read|all&type=limit_80|limit_100|anomaly`

**Response**: paginated alert objects, newest first.

---

### PATCH `/api/v1/alerts/:id/read`
Mark alert as read.

**Auth**: JWT  
Ownership enforced (user can only mark own alerts).

**Success 200** `{ "success": true, "data": { ...updatedAlert } }`

**Errors**: 403, 404

---

### POST `/api/v1/alerts/check`
Trigger alert check for a unit (called by the ticker after each ingest).

**Auth**: JWT + role=admin OR internal call from ticker (no external exposure, bound to localhost).

**Request body**: `{ "unitId": "<id>" }`

**Success 200** `{ "success": true, "data": { "alertsCreated": 1 } }`

---

## 8. Predictions — `/api/v1/predictions`

### GET `/api/v1/predictions/forecast`
7-day hourly forecast for a unit.

**Auth**: JWT  
Ownership enforced.

**Query**: `?unitId=<id>`

**Response data**
```json
{
  "forecast": [
    {
      "timestamp": "2026-10-03T00:00:00.000Z",
      "predictedKwh": 0.95,
      "lowerBound": 0.70,
      "upperBound": 1.20
    }
  ],
  "accuracy": {
    "mae": 0.12,
    "mape": 8.4,
    "holdoutDays": 7,
    "note": "Evaluated on the 7 days prior to today"
  },
  "method": "seasonal_naive_moving_average"
}
```

---

## 9. Recommendations — `/api/v1/recommendations`

### GET `/api/v1/recommendations`
Compute and return triggered recommendations for the current user.

**Auth**: JWT  
Ownership enforced.

**Query**: `?unitId=<id>` (optional)

**Response data**
```json
{
  "recommendations": [
    {
      "ruleId": "HIGH_EVENING_PEAK",
      "priority": 1,
      "title": "High evening peak usage",
      "description": "Your units consume 45% of daily energy between 18:00–22:00.",
      "estimatedSavingKwh": 12.4,
      "estimatedSavingRs": 62.00,
      "triggeredAt": "2026-10-02T20:00:00.000Z"
    }
  ]
}
```
Empty array if no rules are triggered.

---

## 10. Reports — `/api/v1/reports`

### GET `/api/v1/reports/export`
Download a CSV report.

**Auth**: JWT  
- User: own units, any date range.
- Admin: any unit or all units.

**Query**
```
?type=history|summary&unitId=<id>&from=<iso>&to=<iso>&groupBy=hour|day|month
```

**Success 200**: `Content-Type: text/csv`, streamed attachment.

---

## 11. Settings — `/api/v1/settings`

### GET `/api/v1/settings`
**Auth**: JWT + role=admin

**Success 200** → settings object.

---

### PUT `/api/v1/settings`
**Auth**: JWT + role=admin

**Request body**
```json
{
  "defaultMonthlyLimitKwh": 300,
  "tariffSlabs": [
    { "upToKwh": 100, "ratePerKwh": 2.50 },
    { "upToKwh": 200, "ratePerKwh": 3.25 },
    { "upToKwh": 500, "ratePerKwh": 5.00 },
    { "upToKwh": null, "ratePerKwh": 6.50 }
  ]
}
```

**Validation**
- `defaultMonthlyLimitKwh`: number ≥ 10
- `tariffSlabs`: non-empty array, last slab must have `upToKwh: null`, slabs must be in
  ascending order of `upToKwh`
- `ratePerKwh`: number > 0

**Success 200** → updated settings.

**Errors**: 400 VALIDATION_ERROR

---

## 12. Health Check

### GET `/api/v1/health`
**Auth**: None

**Success 200**
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2026-10-02T15:18:22.000Z",
    "mongoConnected": true
  }
}
```
