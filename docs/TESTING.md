# Testing Strategy
# Smart Energy Management System

**Version**: 1.0  
**Read before**: Stage 1, 2, 3, 4, 9

---

## Tools

| Layer | Tool | Notes |
|-------|------|-------|
| Backend unit & API | Jest + Supertest | ES modules: `--experimental-vm-modules` |
| In-memory DB | mongodb-memory-server | Spins up a real Mongo in-process; no external DB needed for tests |
| Frontend unit | Vitest + React Testing Library | Runs in jsdom |
| Coverage | `jest --coverage` / `vitest --coverage` | Target 70% line coverage on backend |

---

## Test File Layout

```
backend/
  src/
    __tests__/
      auth.test.js
      users.test.js
      buildings.test.js
      units.test.js
      energy.test.js
      analytics.test.js
      alerts.test.js
      predictions.test.js
      recommendations.test.js
      simulator.test.js
      formatters.test.js
      idor.test.js

frontend/
  src/
    __tests__/
      components/
        StatCard.test.jsx
        DataTable.test.jsx
        ProgressGauge.test.jsx
      pages/
        Login.test.jsx
        Register.test.jsx
      utils/
        formatters.test.js
```

---

## 1. Auth Tests (`auth.test.js`)

| Test | Expected |
|------|----------|
| Register with valid data | 201, returns token + user (no passwordHash) |
| Register with duplicate email | 409 CONFLICT |
| Register with weak password (< 8 chars) | 400 VALIDATION_ERROR |
| Register with no uppercase | 400 VALIDATION_ERROR |
| Register with role=admin in body | 201, role in response = "user" (admin ignored) |
| Register with missing name | 400 VALIDATION_ERROR |
| Login with correct credentials | 200, valid JWT |
| Login with wrong password | 401 UNAUTHORIZED, message = "Invalid credentials" |
| Login with non-existent email | 401 UNAUTHORIZED, message = "Invalid credentials" (same message) |
| GET /auth/me with valid token | 200, returns user |
| GET /auth/me with no token | 401 |
| GET /auth/me with expired token | 401 |
| GET /auth/me with malformed token | 401 |
| Change password with correct current password | 200 |
| Change password with wrong current password | 401 |
| Change password with weak new password | 400 |

---

## 2. Role Authorization Tests

| Test | Expected |
|------|----------|
| User calling GET /api/v1/users (admin route) | 403 FORBIDDEN |
| User calling POST /api/v1/buildings | 403 FORBIDDEN |
| User calling DELETE /api/v1/units/:id | 403 FORBIDDEN |
| User calling GET /api/v1/settings | 403 FORBIDDEN |
| Admin calling all admin routes | 200 |

---

## 3. Ownership / IDOR Tests (`idor.test.js`)

| Test | Expected |
|------|----------|
| User A calls GET /units/:idOfUserBUnit | 404 (not 403, to avoid leaking existence) |
| User A calls PUT /units/:idOfUserBUnit | 404 |
| User A calls GET /energy/history?unitId=<B's unit> | 404 or empty (no B's records) |
| User A calls GET /analytics/summary?unitId=<B's unit> | 403 or empty |
| User A calls PATCH /alerts/:idOfUserBAlert/read | 403 |
| Admin calls GET /units/:anyUnitId | 200 |

---

## 4. CRUD Validation Tests

For each model (Building, Unit, Settings):

| Test | Expected |
|------|----------|
| Create with all required fields | 201 |
| Create with missing required field | 400 VALIDATION_ERROR |
| Create with field exceeding max length | 400 VALIDATION_ERROR |
| Create with invalid ObjectId reference | 400 VALIDATION_ERROR |
| Create with non-existent building reference | 404 |
| Update with invalid field type | 400 VALIDATION_ERROR |
| Delete a building with active units | 409 CONFLICT |

---

## 5. Energy Ingest Tests (`energy.test.js`)

| Test | Expected |
|------|----------|
| Ingest with valid device key | 200, record created |
| Ingest with invalid device key | 401 |
| Ingest duplicate (same unit + timestamp) | 200, returns existing record (no new record in DB) |
| Ingest with non-hourly timestamp (e.g. :15) | 400 VALIDATION_ERROR |
| Ingest with kwh < 0 | 400 VALIDATION_ERROR |
| Ingest with kwh > 100 | 400 VALIDATION_ERROR |
| Ingest twice identical → count DB records | count = 1 (not 2) |

---

## 6. Analytics Formula Tests (`analytics.test.js`)

Each test seeds specific records directly into the in-memory DB and calls the aggregation
function (or the API endpoint). Expected values are hand-calculated.

| Test | Expected |
|------|----------|
| daily_kwh: 3 records summing to 5.00 | 5.00 |
| daily_kwh: zero records | null (not 0 or NaN) |
| computeCost(0) | 0.00 |
| computeCost(100) | 250.00 (100 × 2.50) |
| computeCost(150) | 250.00 + 50 × 3.25 = 412.50 |
| computeCost(250) | 250.00 + 325.00 + 250.00 = 825.00 |
| pct_change(13.2, 0) | null |
| pct_change(0, 0) | 0 |
| pct_change(15.4, 13.2) | +16.67 (±0.01) |
| usage_pct(252, 300) | 84.0 |
| projection: 30.8 kWh in 2 days, 31-day month | 477.4 kWh |
| Month boundary: records at 23:00 UTC = 04:30 next day IST → correct day grouping | passes |

---

## 7. Simulator Tests (`simulator.test.js`)

| Test | Expected |
|------|----------|
| Same seed → identical output (determinism) | generateReadings called twice with same params produces byte-equal output |
| Evening avg (18–22) > night avg (01–04) for residential | true |
| Weekend daily total ≥ weekday × 1.10 for residential | true |
| Commercial: weekday > weekend × 1.50 | true |
| Anomaly records count ≥ 3 for any unit over 90 days | true |
| Output count = (endUtc - startUtc) / 1h + 1 | exact |
| No kwh < 0 in output | true |

---

## 8. Prediction Tests (`predictions.test.js`)

| Test | Expected |
|------|----------|
| Forecast with 90 days of data → returns 168 hourly records (7 × 24) | 168 items |
| Forecast with 5 days of data → 422 (insufficient data) | 422 |
| MAE ≥ 0 | true |
| MAPE ≥ 0 | true |
| No NaN or Infinity in forecast values | true |
| lower ≤ predicted ≤ upper for all points | true |

---

## 9. Database Tests

| Test | Expected |
|------|----------|
| Unique index on energyRecords {unit, timestamp} — duplicate insert throws | MongoServerError code 11000 |
| Unique index on users.email — duplicate insert throws | MongoServerError code 11000 |
| Unique index on buildings.name — duplicate insert throws | MongoServerError code 11000 |
| deviceKey index (sparse) — null values do not conflict | multiple units with null deviceKey allowed |

---

## 10. Frontend Tests

| Test | Expected |
|------|----------|
| `<Login>`: renders email + password fields | pass |
| `<Login>`: submit with empty fields → inline error | pass |
| `<Login>`: submit with invalid email → inline error | pass |
| `<StatCard>`: renders label, value, unit | pass |
| `<StatCard>`: positive delta shows green up-arrow | pass |
| `<StatCard>`: negative delta shows red down-arrow | pass |
| `<DataTable>`: renders rows, empty state when data=[] | pass |
| `<ProgressGauge>`: pct=50 → green, pct=85 → amber, pct=105 → red | pass |
| `formatKwh(1.5)` → `"1.50 kWh"` | pass |
| `formatRupees(825)` → `"₹825.00"` | pass |
| `formatPct(16.67)` → `"+16.7%"` | pass |
| `formatPct(-3.2)` → `"-3.2%"` | pass |

---

## 11. Security Tests

| Test | Expected |
|------|----------|
| NoSQL injection attempt in email: `{ "$gt": "" }` | 400 or 401 (sanitized, not matched) |
| Attempt to set `role: "admin"` in register body | role in DB = "user" |
| Mass assignment: send extra fields in PATCH /units | extra fields not saved to DB |
| Rate limit: 11 register attempts in 1 min | 11th returns 429 |

---

## 12. Edge Cases

| Test | Expected |
|------|----------|
| Analytics with single record in month | correct single-record sum, no division errors |
| Analytics with no records in date range | all numeric fields return null, no NaN |
| Forecast when stddev = 0 for a cell | no divide-by-zero; anomaly detection uses 2× mean rule |
| Month with 28 days (Feb) projection | uses correct days_in_month |
| Unit deactivated mid-month | analytics returns data up to deactivation; ingest for deactivated unit returns 404 |

---

## Running Tests

```bash
# Backend
cd backend
npm test                    # run all tests
npm run test:watch          # watch mode
npm run test:coverage       # with coverage report

# Frontend
cd frontend
npm test                    # run all tests
npm run test:coverage
```

Tests must pass with `NODE_ENV=test` and use `mongodb-memory-server` — no external
MongoDB connection required for the test suite.
