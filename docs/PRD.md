# Product Requirements Document (PRD)
# Smart Energy Management & Consumption Monitoring System

**Version**: 1.0  
**Date**: 2026-10-02  
**Status**: Approved for Stage 0

---

## 1. Problem Statement

Residential and small-commercial electricity consumers in India have no easy way to:
- Know how much energy individual units (flats/offices) consume in real time.
- Track trends, detect waste, and act before their monthly bill surprises them.
- Receive actionable advice without an IoT device (most families cannot afford smart
  meters; this MVP simulates data and is designed to slot real ESP32 hardware in later).

Building administrators (landlords, facility managers) have no unified view across units —
they rely on paper meter readings and manual spreadsheets.

---

## 2. Proposed Solution

A web-based energy management platform that:
1. Simulates realistic hourly consumption data (and later accepts live ESP32/MQTT data
   through the same endpoint).
2. Provides tenants with a rich personal dashboard (consumption, costs, trends, alerts,
   recommendations).
3. Gives administrators a full-system view (all buildings, all units, anomalies,
   top consumers, tariff management).
4. Uses statistical intelligence (moving-average forecasting, z-score anomaly detection,
   rule-based recommendations) — no Python, no ML server required.

---

## 3. Scope

### In Scope (MVP)
- User registration / login (JWT-based).
- Building, unit, and user management (with role-based access).
- Simulated hourly energy data (90 days of historical + live ticker).
- Analytics: daily / weekly / monthly consumption, cost estimation (slab tariff),
  peak-hour analysis, month-to-date vs limit.
- Alerts: 80% and 100% limit breach, anomaly detection.
- 7-day forecast (seasonal-naïve + moving average).
- Rule-based recommendations with estimated savings.
- CSV export of history and admin energy data.
- Admin: tariff/settings management, user/unit management.
- Responsive web UI (desktop, tablet, mobile).

### Out of Scope (MVP — future IoT extension)
- Real ESP32 / MQTT hardware integration (architecture is designed for it).
- Push/email notifications.
- Multi-building tenant transfers.
- Billing integration (payment gateway).
- Deep-learning forecasting.
- Mobile native app.

---

## 4. MoSCoW Prioritisation

### Must Have (MVP Blockers)
- M1: User authentication (register, login, JWT, role).
- M2: Building CRUD (admin only).
- M3: Unit CRUD with ownership enforcement.
- M4: Seeded simulated data (90 days, 3 demo units, anomalies).
- M5: Energy ingest endpoint (idempotent, device API key).
- M6: User dashboard with all 4 stat cards, consumption chart, limit gauge.
- M7: Analytics endpoint (daily/weekly/monthly aggregations in IST).
- M8: Alert generation (80%/100% and anomaly) and display.
- M9: Admin dashboard (system totals, top consumers, open alerts).
- M10: Admin user and unit management pages.
- M11: All pages have loading / empty / error / populated states.
- M12: Landing, Login, Register pages.
- M13: SECURITY: input validation, IDOR prevention, helmet, rate limiting.
- M14: Slab-based cost estimation.

### Should Have
- S1: Recommendations page with estimated savings.
- S2: 7-day forecast with MAE/MAPE accuracy metric.
- S3: History page with filters, pagination, CSV export.
- S4: Profile page (change password, display name).
- S5: Admin Buildings page.
- S6: Admin Settings page (tariff slabs, default monthly limit).
- S7: Admin Energy Monitoring page (per-unit reading view).
- S8: Dark / light theme toggle, persisted in localStorage.
- S9: Live ticker (SIMULATOR_ENABLED env flag, labels data "Simulated live").
- S10: Heatmap (hour-of-week) on user dashboard.

### Nice to Have
- N1: Admin Reports page (aggregate CSV).
- N2: Count-up animation on first KPI load.
- N3: Forecast uncertainty band on chart.
- N4: Peak-hour one-line insight generated from real data.
- N5: Predictions page (full 7-day chart with MAPE).
- N6: Design-preview dev route.

### Future (Post-MVP)
- F1: ESP32 → MQTT → bridge → POST /energy/ingest (no backend change needed).
- F2: Push/email notifications.
- F3: Multi-language support.
- F4: Mobile native app (React Native).
- F5: Deep-learning forecast (Python microservice over REST, same /api/v1/predictions shape).
- F6: Billing integration.

---

## 5. MVP Definition

**The MVP is fully functional without any IoT hardware.** It runs on a single machine
with Node.js and MongoDB installed. After `npm run seed:admin && npm run seed:data`, the
demo has:
- An admin account and a user account with 3 units and 90 days of data.
- A live simulator ticker (when `SIMULATOR_ENABLED=true`) appending the current hour.
- All P1 pages working with real data from MongoDB, zero fake numbers in the UI.

---

## 6. Functional Requirements

| ID | Requirement |
|----|-------------|
| FR-01 | Users can register with name, email, password. Role is always "user". |
| FR-02 | Users can log in and receive a JWT (1-hour expiry). |
| FR-03 | Admin can create/read/update/delete buildings. |
| FR-04 | Users can create units in existing buildings (ownership = self). Admin can create units for any user. |
| FR-05 | Every energy query is scoped to the requesting user's units (or all units for admin). |
| FR-06 | The system stores hourly kWh consumed (not cumulative meter value). |
| FR-07 | Analytics aggregations run in MongoDB using Asia/Kolkata timezone. |
| FR-08 | Cost is computed on-the-fly from current tariff slabs; never stored. |
| FR-09 | An alert is raised at 80% and 100% of monthly limit; deduplicated (one open alert per unit per type per month). |
| FR-10 | Anomaly alerts are raised when z-score of a reading vs same-hour-of-week profile exceeds 3. Deduplicated per unit per calendar day. |
| FR-11 | The simulator is a pure function with a seeded RNG. The same seed always produces the same data. |
| FR-12 | POST /energy/ingest is idempotent: duplicate (unit + timestamp) returns 200 with the existing record, not an error. |
| FR-13 | CSV export is available for history (user) and energy monitoring (admin). |
| FR-14 | Admin can update tariff slabs and default monthly limit in settings. |
| FR-15 | Forecasts are computed on demand; not persisted. MAE and MAPE of the last-7-day holdout are returned. |
| FR-16 | Recommendations are computed on demand from rules defined in docs/INTELLIGENCE.md. |

---

## 7. Non-Functional Requirements

| ID | Requirement |
|----|-------------|
| NFR-01 | **Performance**: Analytics endpoints respond within 2 seconds for 90 days of data with proper indexes. |
| NFR-02 | **Security**: All inputs validated with zod. Mongo-sanitized. Auth on every protected route. IDOR-proof ownership checks. |
| NFR-03 | **Reliability**: The simulator seeding is idempotent; running it twice does not create duplicate records. |
| NFR-04 | **Maintainability**: Files < 300 lines, single responsibility, clear names. |
| NFR-05 | **Accessibility**: WCAG AA contrast, labelled inputs, keyboard navigation, no colour-only status. |
| NFR-06 | **Offline demo**: All assets served locally (no CDN); app works on college Wi-Fi or hotspot. |
| NFR-07 | **Observability**: morgan logs all requests in dev; error handler logs stack traces (never to client). |
| NFR-08 | **Portability**: Runs on Windows, macOS, Linux with Node.js LTS and MongoDB 6+. |

---

## 8. Roles and Permissions Matrix

| Action | User (self) | User (other) | Admin |
|--------|-------------|--------------|-------|
| Register | ✅ | — | — |
| Login | ✅ | — | — |
| View own profile | ✅ | ❌ | ✅ |
| Change own password | ✅ | ❌ | ✅ |
| List users | ❌ | ❌ | ✅ |
| Deactivate user | ❌ | ❌ | ✅ |
| Create building | ❌ | ❌ | ✅ |
| List buildings | ✅ (read-only) | — | ✅ |
| Update / delete building | ❌ | ❌ | ✅ |
| Create unit (own) | ✅ | ❌ | ✅ |
| Create unit (other user) | ❌ | ❌ | ✅ |
| View own unit | ✅ | ❌ | ✅ |
| Update own unit name/limit | ✅ | ❌ | ✅ |
| Reassign unit owner | ❌ | ❌ | ✅ |
| Delete unit | ❌ | ❌ | ✅ |
| Ingest energy (device key) | ✅ (own unit) | ❌ | ✅ |
| View own energy analytics | ✅ | ❌ | ✅ |
| View all energy analytics | ❌ | ❌ | ✅ |
| View own alerts | ✅ | ❌ | ✅ |
| View all alerts | ❌ | ❌ | ✅ |
| Mark alert read | ✅ (own) | ❌ | ✅ |
| View own recommendations | ✅ | ❌ | ✅ |
| View own forecast | ✅ | ❌ | ✅ |
| Export own CSV | ✅ | ❌ | ✅ |
| Export all CSV | ❌ | ❌ | ✅ |
| View / update settings | ❌ | ❌ | ✅ |

---

## 9. Ambiguities Resolved

| Ambiguity | Resolution |
|-----------|------------|
| Device API key format | `deviceKey` field on Unit (stored as SHA-256 hash). Plain key printed once at creation. |
| Duplicate ingest response | HTTP 200 + existing record (no error — allows ESP32 retries). |
| Slab tariff structure | Indian EB style: up to 100 units @ ₹2.50, 101–200 @ ₹3.25, 201–500 @ ₹5.00, 500+ @ ₹6.50. Editable by admin. |
| Password strength | Min 8 chars, at least 1 uppercase, at least 1 digit. |
| Recommendations stored? | No — BINDING DECISION 9. Computed on demand from live data. |
| Anomaly alert dedup period | Per calendar day (IST) per unit. |
| JWT refresh | No refresh token in MVP. 401 → clean logout. User re-logs in. |
| CSV import endpoint | `POST /api/v1/admin/energy/import` (admin only, multipart CSV). Added to API_CONTRACT. |
| `settings` scope | Global singleton. Admin edits it. All cost calculations use the current singleton. |

---

## 10. Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Mongo aggregation slow on 90 days × 10 units × 24 = 21600 records | Low | High | Compound indexes {unit, timestamp} and {building, timestamp}; $match first. |
| Viva question on statistical vs ML forecasting | High | Medium | Document justification in INTELLIGENCE.md. |
| Demo breaks due to missing seed data | Medium | High | Idempotent seed; README step-by-step. |
| Student forgets to set env vars | High | High | Validation on startup fails fast with a clear message. |
| JWT expires during demo (1-hour) | Medium | Medium | Seed admin password is known; re-login takes 10 seconds. |
