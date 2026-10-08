# AGENTS.md — Smart Energy Management System
# READ THIS FILE AT THE START OF EVERY STAGE BEFORE WRITING ANY CODE.

---

## HOW AGENTS MUST WORK

- Work in STAGES (0 to 9). Do **one stage at a time**.
- At the end of each stage: run the app, run the tests, fix all failures, then report
  (a) files created, (b) commands run, (c) test results, (d) gate evidence.
- Then print **"WAITING FOR APPROVAL"** and STOP. Do not start the next stage until the
  user replies with approval.
- Never summarise failures as "minor". Find root causes. Never hide errors with empty
  try/catch, and never disable or delete tests to make them pass.
- Re-read this file at the start of every stage.
- Never delete or overwrite files outside the current task. Ask before destructive commands.

---

## PROJECT RULES (BINDING — DO NOT DEVIATE WITHOUT APPROVAL)

### STACK
- **Frontend**: React + Vite (JavaScript), Tailwind CSS, React Router, Axios, Recharts,
  lucide-react (icons), @fontsource/inter (font)
- **Backend**: Node.js LTS (ES modules), Express, MongoDB + Mongoose, JWT, bcryptjs, zod,
  helmet, cors, express-rate-limit, express-mongo-sanitize, morgan, node-cron
- **Tests**: Jest + Supertest + mongodb-memory-server (backend); Vitest + React Testing
  Library (frontend)
- **NO** Python, NO Docker, NO microservices, NO TypeScript, NO Redux.

### RULES
1. `/docs` is the source of truth. Read `docs/API_CONTRACT.md` and `docs/DATABASE.md`
   before coding. If code and docs disagree, fix one and tell the user.
2. Never invent endpoints, fields or env vars that are not in the docs. If something is
   missing, update the docs first.
3. No hardcoded or fake analytics. Every dashboard number comes from MongoDB via the API.
4. Never claim "real-time". Label simulated data **"Simulated live"**.
5. Store all timestamps in UTC. Group by day/week/month in Asia/Kolkata. Weeks start Monday.
6. Secrets only in `.env`; commit only `.env.example`. Never log passwords or tokens.
7. Every route: validates input (zod), checks auth, checks role, checks ownership.
8. Response envelope: `{ success, data, message }` and
   `{ success: false, error: { code, message, details } }`. API prefix: `/api/v1`.
9. Keep code simple, small files, clear names, commented enough for a student to explain.
10. Pin dependency versions (no "latest"). Check packages are maintained and compatible
    with the pinned React/Vite versions before adding them.
11. Tailwind: follow the official Vite setup for the installed major version exactly.
    Verify a utility class renders before building pages.
12. Recharts: every chart sits in a parent with an explicit height and uses
    `ResponsiveContainer`. Never render a chart with empty data; show `EmptyState` instead.
13. No external CDN assets (fonts via @fontsource, icons via lucide-react) so the demo
    works offline and on college Wi-Fi.
14. Frontend never calls an endpoint missing from `docs/API_CONTRACT.md`. API base URL from
    `VITE_API_URL`. Backend CORS origin from env.
15. Mongo aggregations: `$match` on indexed fields first; use `$dateTrunc`/`$dateToString`
    with timezone `"Asia/Kolkata"`. Never load all records into memory to sum them in JS.
16. Money and energy formatting goes through one shared formatter (₹, kWh, 2 decimals).
17. `localStorage` only for the JWT (and theme preference). Handle 401 by logging out cleanly.
18. A page is not "done" until it has loading, empty, error and populated states, and the
    user has seen it working in the browser with zero console errors or warnings.

---

## BINDING DECISIONS (DO NOT CHANGE AFTER STAGE 0 WITHOUT EXPLICIT APPROVAL)

1. **OWNERSHIP**: Admin creates Buildings. A Unit belongs to one Building and has exactly
   one owner (User). Users may create units only in existing buildings, for themselves.
   Admin can create units and reassign owners. Every unit/energy/alert/recommendation
   query is scoped by owner unless the caller is admin.

2. **ENERGY LIMIT**: stored per unit as `monthlyLimitKwh` (default from settings).
   Usage % = month-to-date kWh / `monthlyLimitKwh`. Alerts at 80% and 100%.

3. **GRANULARITY**: hourly readings = kWh consumed in **that hour** (not a cumulative
   meter value).

4. **TIME**: UTC in DB, Asia/Kolkata for grouping and display.

5. **TARIFF**: slab-based, stored in settings, editable by admin. Cost is **computed,
   never stored**.

6. **ADMIN**: created only by `npm run seed:admin`. Public register always creates
   `role=user`.

7. **DEMO ACCOUNTS**: seed prints credentials `admin@demo.com` and `user@demo.com`.
   The demo user owns 3 units with 90 days of data, including injected anomalies and
   one unit that crosses 80% of its limit this month.

8. **LIVE**: a simulator ticker appends hourly readings (env flag `SIMULATOR_ENABLED`).
   UI labels it "Simulated live". The same `POST /energy/ingest` endpoint will accept
   ESP32/MQTT data in future.

9. **COLLECTIONS**: `users`, `buildings`, `units`, `energyRecords`, `alerts`,
   `recommendations` (not stored — computed on demand), `settings`.
   No `reports` collection (generated on demand). Predictions are computed/cached, not stored.

10. **PAGE PRIORITY**: P1 = Landing, Login, Register, User Dashboard, Analytics, History,
    Alerts, Admin Dashboard, Admin Users, Admin Units. P2 = Predictions, Recommendations,
    Reports, Profile, Admin Buildings, Admin Settings, Admin Energy Monitoring.
    Finish P1 before P2.

11. **INTELLIGENCE** (no Python, no deep learning):
    - Prediction: seasonal-naive + moving average using an hour-of-week profile, 7-day
      forecast, evaluated with MAE and MAPE on a holdout of the last 7 days.
    - Anomaly detection: z-score versus the same hour-of-week, threshold 3.
    - Recommendations: explicit rules (see docs/INTELLIGENCE.md).

---

## SOURCE OF TRUTH FILES (read before each relevant stage)

| File | Read before stage |
|------|------------------|
| `docs/DATABASE.md` | 1, 2, 3 |
| `docs/API_CONTRACT.md` | 2, 3, 4, 5, 6, 7 |
| `docs/ANALYTICS.md` | 4 |
| `docs/SIMULATOR.md` | 3 |
| `docs/INTELLIGENCE.md` | 4 |
| `docs/UI_SPEC.md` | 5, 6, 7, 8 |
| `docs/SECURITY.md` | 1, 2, 9 |
| `docs/TESTING.md` | 1, 2, 3, 4, 9 |
