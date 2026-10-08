# Architecture
# Smart Energy Management System

**Version**: 1.0

---

## Overview

A three-tier web application with a simulated IoT data layer. The architecture is
designed so that real ESP32 hardware can plug in later by implementing the MQTT-to-HTTP
bridge — **no backend changes required**.

---

## Text Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER'S BROWSER                              │
│                                                                     │
│  React + Vite (Tailwind, Recharts, React Router, Axios)             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │  Landing /   │  │  User Pages  │  │     Admin Pages          │  │
│  │  Auth Pages  │  │  Dashboard   │  │  Dashboard, Users,       │  │
│  │              │  │  Analytics   │  │  Units, Buildings,       │  │
│  │  Login       │  │  History     │  │  Settings, Energy Mgmt   │  │
│  │  Register    │  │  Alerts      │  │                          │  │
│  └──────────────┘  │  Predictions │  └──────────────────────────┘  │
│                    │  Reports     │                                 │
│                    └──────────────┘                                 │
│                           │                                         │
│           Axios HTTP calls │  (Bearer JWT)                          │
│           VITE_API_URL ────┘                                        │
└───────────────────────────┬─────────────────────────────────────────┘
                            │ HTTPS (REST JSON)
                            │
┌───────────────────────────▼─────────────────────────────────────────┐
│                      BACKEND (Node.js / Express)                    │
│                                                                     │
│  app.js: middleware stack                                           │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ helmet → cors → morgan → express-mongo-sanitize →            │  │
│  │ express-rate-limit → express.json() → routes                 │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  Routes (all under /api/v1):                                        │
│  /auth  /users  /buildings  /units  /energy  /analytics            │
│  /alerts  /predictions  /recommendations  /reports  /settings      │
│                                                                     │
│  Middleware: authenticate  requireRole  errorHandler               │
│                                                                     │
│  Services (business logic):                                         │
│  analyticsService  alertService  predictionService                 │
│  recommendationService  reportService  simulatorService            │
│                                                                     │
│  ┌───────────────────────────────┐                                 │
│  │     Simulator Ticker          │                                 │
│  │  (node-cron, SIMULATOR_ENABLED│                                 │
│  │   appends hourly readings)    │                                 │
│  └───────────────────────────────┘                                 │
│                                                                     │
│  server.js: listen on PORT                                          │
└───────────────────────────┬─────────────────────────────────────────┘
                            │ Mongoose ODM
                            │
┌───────────────────────────▼─────────────────────────────────────────┐
│                      MongoDB (6.x)                                  │
│                                                                     │
│  Collections:                                                       │
│  ┌──────────┐ ┌───────────┐ ┌────────┐ ┌───────────────────────┐  │
│  │  users   │ │ buildings │ │ units  │ │    energyRecords       │  │
│  └──────────┘ └───────────┘ └────────┘ │  (21,600+ docs)       │  │
│                                        │  Indexes:              │  │
│  ┌──────────┐ ┌───────────┐            │  {unit, timestamp}     │  │
│  │  alerts  │ │ settings  │            │  {building, timestamp} │  │
│  └──────────┘ └───────────┘            │  {owner, timestamp}    │  │
│                                        └───────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────┐
│            FUTURE IoT EXTENSION (no backend changes needed)         │
│                                                                     │
│  ESP32 Device                                                       │
│     │  MQTT publish every hour                                      │
│     ▼                                                               │
│  MQTT Broker (e.g. Mosquitto, HiveMQ)                              │
│     │  subscribe to "energy/ingest" topic                           │
│     ▼                                                               │
│  MQTT-to-HTTP Bridge (Node.js microservice or script)              │
│     │  POST /api/v1/energy/ingest                                   │
│     │  Header: x-device-key: <unit's device key>                    │
│     │  Body: { unitId, timestamp, kwh, source: "device" }           │
│     ▼                                                               │
│  ← same endpoint, same processing, same DB write →                 │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Directory Structure

```
smart-energy-management/
├── AGENTS.md
├── README.md
├── .env.example
├── .gitignore
│
├── docs/
│   ├── PRD.md
│   ├── DATABASE.md
│   ├── API_CONTRACT.md
│   ├── ANALYTICS.md
│   ├── SIMULATOR.md
│   ├── INTELLIGENCE.md
│   ├── SECURITY.md
│   ├── TESTING.md
│   ├── UI_SPEC.md
│   ├── UI_DESIGN.md          (created in Stage 5)
│   ├── ARCHITECTURE.md
│   ├── ROADMAP.md
│   ├── VIVA_NOTES.md         (created in Stage 9)
│   ├── PRESENTATION.md       (created in Stage 9)
│   └── DEMO_SCRIPT.md        (created in Stage 9)
│
├── backend/
│   ├── package.json
│   ├── .env.example
│   ├── server.js             (starts express, connects mongo)
│   ├── app.js                (middleware, routes — no listen)
│   ├── src/
│   │   ├── config/
│   │   │   ├── env.js        (validates env vars on startup)
│   │   │   └── db.js         (mongoose connect)
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Building.js
│   │   │   ├── Unit.js
│   │   │   ├── EnergyRecord.js
│   │   │   ├── Alert.js
│   │   │   └── Settings.js
│   │   ├── middleware/
│   │   │   ├── authenticate.js
│   │   │   ├── requireRole.js
│   │   │   └── errorHandler.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── users.js
│   │   │   ├── buildings.js
│   │   │   ├── units.js
│   │   │   ├── energy.js
│   │   │   ├── analytics.js
│   │   │   ├── alerts.js
│   │   │   ├── predictions.js
│   │   │   ├── recommendations.js
│   │   │   ├── reports.js
│   │   │   └── settings.js
│   │   ├── services/
│   │   │   ├── analyticsService.js
│   │   │   ├── alertService.js
│   │   │   ├── predictionService.js
│   │   │   ├── recommendationService.js
│   │   │   └── reportService.js
│   │   ├── simulator/
│   │   │   ├── generator.js  (pure function)
│   │   │   └── ticker.js     (cron job)
│   │   ├── utils/
│   │   │   ├── AppError.js
│   │   │   ├── catchAsync.js
│   │   │   ├── formatters.js
│   │   │   └── rng.js
│   │   └── scripts/
│   │       ├── seedAdmin.js
│   │       └── seedData.js
│   └── __tests__/
│       └── *.test.js
│
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── index.html
    ├── public/
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css
        ├── components/
        │   ├── ui/           (design system components)
        │   │   ├── Button.jsx
        │   │   ├── Card.jsx
        │   │   ├── StatCard.jsx
        │   │   ├── Badge.jsx
        │   │   ├── DataTable.jsx
        │   │   ├── Modal.jsx
        │   │   ├── ConfirmDialog.jsx
        │   │   ├── Input.jsx
        │   │   ├── Select.jsx
        │   │   ├── DateRangePicker.jsx
        │   │   ├── Tabs.jsx
        │   │   ├── Toast.jsx
        │   │   ├── Skeleton.jsx
        │   │   ├── EmptyState.jsx
        │   │   ├── ErrorState.jsx
        │   │   ├── ProgressGauge.jsx
        │   │   ├── Heatmap.jsx
        │   │   └── PageHeader.jsx
        │   ├── charts/
        │   │   ├── ConsumptionChart.jsx
        │   │   ├── ForecastChart.jsx
        │   │   └── MiniSparkline.jsx
        │   ├── layout/
        │   │   ├── AppLayout.jsx
        │   │   ├── Sidebar.jsx
        │   │   └── Header.jsx
        │   └── common/
        │       └── ProtectedRoute.jsx
        ├── contexts/
        │   ├── AuthContext.jsx
        │   └── ThemeContext.jsx
        ├── hooks/
        │   ├── useAuth.js
        │   └── useTheme.js
        ├── pages/
        │   ├── Landing.jsx
        │   ├── Login.jsx
        │   ├── Register.jsx
        │   ├── user/
        │   │   ├── Dashboard.jsx
        │   │   ├── Analytics.jsx
        │   │   ├── History.jsx
        │   │   ├── Alerts.jsx
        │   │   ├── Predictions.jsx
        │   │   ├── Recommendations.jsx
        │   │   ├── Reports.jsx
        │   │   └── Profile.jsx
        │   └── admin/
        │       ├── Dashboard.jsx
        │       ├── Users.jsx
        │       ├── Units.jsx
        │       ├── Buildings.jsx
        │       ├── EnergyMonitoring.jsx
        │       ├── Reports.jsx
        │       └── Settings.jsx
        ├── services/
        │   └── api.js        (axios instance + all API call functions)
        └── utils/
            └── formatters.js
```

---

## Key Design Decisions

1. **app.js / server.js split**: `app.js` exports the Express app (usable in tests without
   starting a real server). `server.js` calls `app.listen()`. This is the standard pattern
   for testable Node.js apps.

2. **Denormalised fields in energyRecords**: `building` and `owner` are stored redundantly
   alongside `unit`. This allows aggregation pipelines to `$match` on `{ building, timestamp }`
   or `{ owner, timestamp }` using their own indexes without a `$lookup` (join). The trade-off
   is a small data redundancy, acceptable for this scale.

3. **Services layer**: Business logic (analytics aggregations, alert dedup, prediction) lives
   in `/services/`, not in route handlers. Route handlers are thin: validate → call service
   → send response. This keeps files small and makes unit testing easier.

4. **Simulator is a pure function**: No I/O in `generator.js`. The seeding script and the
   ticker call the function and handle the DB writes separately. This allows the simulator
   to be unit-tested without a database.

5. **Future IoT slot-in**: The ingest endpoint already accepts `x-device-key` auth. The
   only addition needed for IoT is the MQTT-to-HTTP bridge (a small standalone script or
   microservice). The backend contract does not change.
