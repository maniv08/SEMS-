# Project Roadmap
# Smart Energy Management System

**Version**: 1.0

---

## Stage Completion Criteria

| Stage | Name | Completion Criteria |
|-------|------|---------------------|
| **0** | Specs Only | All docs in `/docs` created and reviewed. AGENTS.md committed. No application code. |
| **1** | Backend Foundation + Auth | All auth tests pass. `npm run seed:admin` creates admin. `curl register → login → /me` works. Zero test failures. |
| **2** | Core CRUD + Ownership | All CRUD tests pass including IDOR test. Pagination works. Every deviation from API_CONTRACT.md documented and resolved. |
| **3** | Simulator, Seed, Ingestion | 21,600 records seeded for 10 units × 90 days. Seeding twice = no duplicates. Ticker appends data. Evening avg > night avg proven. Simulator tests pass. |
| **4** | Analytics, Alerts, Intelligence | All formula tests pass. No NaN/null returned for empty data. API returns correct values verified against raw DB queries. All alert and recommendation rules trigger on demo data. |
| **5** | Design System + Frontend Foundation | `/design-preview` screenshots in both themes. Login as admin vs user shows correct menu. Admin page blocked for user role. Zero console errors. |
| **6** | User Pages + Dashboard | Screenshots at 1440/1024/768px in light+dark. 3 dashboard numbers match direct DB queries. All user pages open with no console errors. All 4 states demonstrated. |
| **7** | Admin Pages | Full admin walkthrough: create building → create unit → view energy → manage users → edit settings. Zero console errors. |
| **8** | Landing + UI QA Polish | Landing page deployed locally. Lighthouse a11y ≥ 90 on Dashboard + Login. All 4 page states on every page. Dark mode fully readable. Responsive at 390px. |
| **9** | Hardening, Tests, Docs | All tests pass. `npm audit` shows no high/critical vulns. Production build succeeds. README is complete. Fresh clone works per README. |

---

## Detailed Stage Checklist

### Stage 0 ✅ (current)
- [x] AGENTS.md
- [x] docs/PRD.md
- [x] docs/DATABASE.md
- [x] docs/API_CONTRACT.md
- [x] docs/ANALYTICS.md
- [x] docs/SIMULATOR.md
- [x] docs/INTELLIGENCE.md
- [x] docs/SECURITY.md
- [x] docs/TESTING.md
- [x] docs/UI_SPEC.md
- [x] docs/ARCHITECTURE.md
- [x] docs/ROADMAP.md

### Stage 1 — Backend Foundation + Auth
- [ ] `backend/` initialized (Node.js ESM, package.json with pinned deps)
- [ ] `backend/app.js` and `backend/server.js` split
- [ ] Env validation (`src/config/env.js`) — exits on missing vars
- [ ] MongoDB connection (`src/config/db.js`)
- [ ] helmet, cors (from env), morgan, mongo-sanitize, rate-limit middleware
- [ ] Central error handler + 404 handler
- [ ] User model with indexes
- [ ] Auth routes: register, login, /me, change-password
- [ ] `authenticate` middleware
- [ ] `requireRole` middleware
- [ ] `npm run seed:admin` script
- [ ] Jest + mongodb-memory-server configured
- [ ] All auth tests pass

### Stage 2 — Core CRUD + Ownership
- [ ] Building, Unit, Settings models with indexes
- [ ] Users admin routes
- [ ] Buildings routes
- [ ] Units routes (with ownership)
- [ ] Settings routes
- [ ] `scopeToUser` helper
- [ ] Pagination helper
- [ ] IDOR test suite passes
- [ ] All CRUD tests pass

### Stage 3 — Simulator, Seed, Ingestion
- [ ] `backend/src/utils/rng.js` (Mulberry32)
- [ ] `backend/src/simulator/generator.js` (pure function)
- [ ] `backend/src/scripts/seedData.js` (idempotent, bulk insert)
- [ ] EnergyRecord model with unique compound index
- [ ] `POST /energy/ingest` endpoint (idempotent)
- [ ] `backend/src/simulator/ticker.js` (node-cron)
- [ ] `POST /admin/energy/import` (CSV, admin)
- [ ] `npm run seed:data` command
- [ ] Simulator tests pass (determinism, peak > night, etc.)

### Stage 4 — Analytics, Alerts, Intelligence
- [ ] Analytics service (all aggregations)
- [ ] Analytics routes (/summary, /consumption, /peak, /admin/overview)
- [ ] Alert service (80%, 100%, anomaly, dedup)
- [ ] Alerts routes
- [ ] Prediction service (SNMA algorithm)
- [ ] Predictions route
- [ ] Recommendation service (5 rules)
- [ ] Recommendations route
- [ ] Reports service (CSV generation)
- [ ] Reports route
- [ ] All formula tests pass
- [ ] Alert triggers verified on demo data

### Stage 5 — Design System + Frontend Foundation
- [ ] `frontend/` initialized (Vite + React)
- [ ] Tailwind CSS configured per official Vite guide
- [ ] CSS custom properties (theme tokens)
- [ ] @fontsource/inter installed and applied
- [ ] All 15 UI components built
- [ ] AuthContext + ProtectedRoute + AdminRoute
- [ ] Axios instance with interceptors
- [ ] App layout (sidebar, header)
- [ ] Login and Register pages
- [ ] `/design-preview` route
- [ ] Theme toggle working + persisted
- [ ] Frontend tests for components

### Stage 6 — User Pages
- [ ] User Dashboard (all 4 rows)
- [ ] Auto-refresh (60s)
- [ ] Analytics page
- [ ] History page + CSV export
- [ ] Alerts page
- [ ] Predictions page (P2)
- [ ] Recommendations page (P2)
- [ ] Reports page (P2)
- [ ] Profile page (P2)
- [ ] Responsive at 1440/1024/768/390px
- [ ] 3 numbers verified against DB

### Stage 7 — Admin Pages
- [ ] Admin Dashboard
- [ ] Admin Users
- [ ] Admin Units
- [ ] Admin Buildings (P2)
- [ ] Admin Energy Monitoring (P2)
- [ ] Admin Reports (P2)
- [ ] Admin Settings (P2)

### Stage 8 — Landing + QA Polish
- [ ] Landing page (hero, features, CTA)
- [ ] Visual consistency audit (no hardcoded hex)
- [ ] Dark mode audit
- [ ] Responsive audit at all 4 breakpoints
- [ ] Keyboard navigation tested
- [ ] Lighthouse a11y ≥ 90

### Stage 9 — Hardening, Tests, Docs
- [ ] All endpoint vs API_CONTRACT audit
- [ ] `npm audit` — no high/critical
- [ ] Production build passes (`npm run build`)
- [ ] README.md complete
- [ ] docs/VIVA_NOTES.md (15 questions)
- [ ] docs/PRESENTATION.md
- [ ] docs/DEMO_SCRIPT.md
- [ ] Fresh clone test

---

## Deployment Plan

### Target Platform (free tier, suitable for student project demo)

| Layer | Service | Notes |
|-------|---------|-------|
| Frontend | Vercel or Netlify | Auto-deploys from GitHub main branch. Free custom domain. |
| Backend | Render (free) or Railway | Free tier has cold starts (30s first request). Documented. |
| Database | MongoDB Atlas M0 | Free shared cluster, 512 MB. More than enough for seed data. |

### Cold Start Note (Render free tier)
Render free instances spin down after 15 minutes of inactivity. The first request after
spin-down takes ~30 seconds. For the live demo, wake the server 2 minutes before the
presentation by visiting `https://<backend-url>/api/v1/health`.

### Environment Variables for Deployment

Set in the platform dashboard (never in git):
```
NODE_ENV=production
MONGO_URI=<atlas-connection-string>
JWT_SECRET=<random-64-char-hex>
CORS_ORIGIN=https://<your-frontend-domain>
SIMULATOR_ENABLED=true
```

### Deployment Steps
1. Push code to GitHub.
2. Connect Render/Railway to GitHub repo, set root as `/backend`.
3. Connect Vercel/Netlify to GitHub repo, set root as `/frontend`, build command
   `npm run build`, publish directory `dist`.
4. Set `VITE_API_URL=https://<backend-url>/api/v1` in Vercel environment.
5. On backend: `npm run seed:admin && npm run seed:data` (one-time via Render shell).
6. Visit frontend URL, login with demo credentials.
