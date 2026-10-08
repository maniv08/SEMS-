# UI Specification
# Smart Energy Management System

**Version**: 1.0  
**Read before**: Stage 5, 6, 7, 8

---

## Global Layout

```
┌───────────────────────────────────────────────────────────────┐
│  HEADER: [Page Title]  [● Simulated live HH:MM]  [☀/☾]  [User▾] │
├──────────┬────────────────────────────────────────────────────┤
│          │                                                    │
│ SIDEBAR  │              PAGE CONTENT                         │
│  248px   │         (max-width: 1440px, centred)              │
│          │                                                    │
│ icon+    │                                                    │
│ label    │                                                    │
│          │                                                    │
│ (icons   │                                                    │
│  only    │                                                    │
│  <1024px)│                                                    │
│          │                                                    │
│ (drawer  │                                                    │
│  <768px) │                                                    │
└──────────┴────────────────────────────────────────────────────┘
```

**Header height**: 56px  
**Sidebar width**: 248px (expanded), 56px (collapsed/icon-only), 0 + hamburger (mobile drawer)  
**Content padding**: 24px (desktop), 16px (tablet/mobile)  
**Grid**: 12-column, 16px gap on desktop, 8px gap on mobile

---

## Colour Tokens (CSS Variables)

```css
/* Light */
--bg: #F6F8FA;
--surface: #FFFFFF;
--border: #E5E9F0;
--text-primary: #0F172A;
--text-muted: #64748B;
--brand: #10B981;       /* emerald — healthy, primary CTA */
--accent: #3B82F6;      /* electric blue — charts, links */
--warning: #F59E0B;     /* amber — 80% limit */
--critical: #EF4444;    /* red — 100%+, anomaly */
--violet: #8B5CF6;      /* prediction */
--radius-card: 14px;
--shadow-card: 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04);

/* Dark */
--bg: #0B1220;
--surface: #111A2E;
--border: #1E293B;
--text-primary: #E6EDF7;
--text-muted: #94A3B8;
/* Brand, accent, warning, critical, violet are identical in dark mode */
```

---

## Typography Scale

| Use | Size | Weight | Class / Note |
|-----|------|--------|--------------|
| Page title | 24px (mobile: 20px) | 600 semibold | `<h1>` |
| Card title | 14px | 500 medium | muted colour |
| KPI value | 30px | 600 semibold | tabular-nums |
| Body | 14px | 400 | |
| Caption | 12px | 400 | muted |
| Button | 14px | 500 | |

All numbers use `font-variant-numeric: tabular-nums`.

---

## Pages

---

### P0 — Landing Page

**Purpose**: First impression for unauthenticated visitors. Drive to Login / Register.

**Sections**
1. **Hero**: Full-width gradient background. Headline "Smart Energy, Zero Waste."
   Sub-headline. Two CTAs: "Get Started" (→ /register) and "Login" (→ /login).
   Right panel: animated mini-chart (uses static demo data — not from the API).
2. **Features strip**: 3 cards — Real-time monitoring, Predictive analytics, Cost control.
3. **How it works**: Icon strip: 1. Connect → 2. Monitor → 3. Save.
4. **Footer**: project name, tech stack badge.

**API calls**: None.  
**States**: Static only.

---

### P1 — Login Page

**Purpose**: Authenticate existing users.

**Components**: `<Input email>`, `<Input password>` (show/hide toggle), `<Button primary>`,
link to Register.

**Behaviour**
- Inline error on submit: field-level (zod-mirror frontend validation) + server errors
  mapped to fields.
- Disabled button while request is in flight.
- On 401: show "Invalid credentials" under form (not inside the fields).
- On success: save JWT to localStorage, redirect to `/dashboard`.

**API calls**: `POST /api/v1/auth/login`

**States**: default, loading (button spinner), error.

---

### P2 — Register Page

**Purpose**: Create a new user account.

**Components**: `<Input name>`, `<Input email>`, `<Input password>`, `<Input confirm-password>`,
`<Button primary>`, link to Login.

**Behaviour**
- Confirm password validated client-side before API call.
- Role field not present in form (always set to "user" by backend).
- On 409: show "Email already registered."
- On success: same as Login.

**API calls**: `POST /api/v1/auth/register`

---

### P3 — User Dashboard

**Purpose**: Single-screen energy overview for a unit owner.

**Layout**: 12-column grid, 4 rows.

**ROW 1 — Stat Cards** (4 × 3 cols)

| Card | Value | Delta | API |
|------|-------|-------|-----|
| Today | kWh consumed today | % vs same weekday last week | `/analytics/summary` |
| This Month | kWh month-to-date | % vs last month at same day count | `/analytics/summary` |
| Estimated Bill | ₹ (labelled "Projected" if month incomplete) | — | `/analytics/summary` |
| Current Load | kWh in latest hour (+ "Simulated live" badge) | — | `/analytics/summary` |

**ROW 2 — Chart + Limit Card** (8 + 4 cols)

Left (8 cols): `<ConsumptionChart>` with `<SegmentedControl Day|Week|Month>`, unit selector
(All or one of the user's units), comparison line toggle (previous period dashed), forecast
overlay toggle (violet dashed, only for Day).

Right (4 cols): `<Card>` "Monthly Limit"
- `<ProgressGauge>` (semicircle, green/amber/red)
- Usage: `142 / 300 kWh (47.3%)`
- Days remaining: 29
- Projected: 300.5 kWh (at this rate)

**ROW 3 — Heatmap + Forecast + Alerts** (5 + 4 + 3 cols)

Left (5 cols): `<Heatmap>` 7 rows × 24 cols, colour = avg kWh in each cell.
Below heatmap: one-line insight generated from data: "Your peak is weekdays 19–21."

Middle (4 cols): 7-day forecast mini-bar-chart. Caption: `Forecast accuracy: 91.6% (MAE 0.12 kWh)`.

Right (3 cols): Alerts feed — latest 5 open alerts with type badge, message, timestamp.
Link "View all alerts".

**ROW 4 — Recommendation + Units Table** (full width, stacked)

Top: `<Card>` — Highest-priority triggered recommendation with rule title, description,
estimated saving in kWh and ₹. Link "View all recommendations".

Bottom: `<DataTable>` — User's units with columns:
Unit Name | Building | Month kWh | % of Limit | Status (badge) | Actions (View history)

**Auto-refresh**: `setInterval(60_000)` — refetch all row-1 and row-2 data. Keep stale
data visible while refetching (no flash). Show "Last updated HH:MM" in header.

**Skeleton**: shape-matched on first load — 4 stat card skeletons, chart skeleton (flat
line box), table skeleton rows.

**States**: loading (skeletons), empty (no units → EmptyState "Add your first unit"),
error (ErrorState + retry), populated.

**API calls**:
- `GET /api/v1/analytics/summary`
- `GET /api/v1/analytics/consumption?period=day|week|month`
- `GET /api/v1/analytics/peak`
- `GET /api/v1/predictions/forecast`
- `GET /api/v1/alerts?status=open&limit=5`
- `GET /api/v1/recommendations`
- `GET /api/v1/units`

---

### P4 — Analytics Page

**Purpose**: Deeper time-series exploration.

**Components**:
- Period selector (Day / Week / Month)
- Date navigation (← prev / next →)
- Unit selector (All or one)
- `<ConsumptionChart>` — full height (400px parent)
- Stat strip below chart: Total, Average, Peak Hour, Estimated Cost
- `<Heatmap>` (hour-of-week over selected range)

**States**: loading, empty (no records in date range), error, populated.

**API calls**:
- `GET /api/v1/analytics/consumption`
- `GET /api/v1/analytics/peak`
- `GET /api/v1/analytics/summary`

---

### P5 — History Page

**Purpose**: Browse and export raw hourly records.

**Components**:
- Filter bar: Unit selector, Date range picker, Anomaly toggle
- `<DataTable>` with columns: Timestamp (IST) | Unit | kWh | Anomaly | Source
- Pagination
- "Export CSV" button

**States**: loading (table skeleton), empty, error, populated.

**API calls**:
- `GET /api/v1/energy/history`
- `GET /api/v1/energy/export` (CSV download, triggered by button)
- `GET /api/v1/units`

---

### P6 — Alerts Page

**Purpose**: View and manage alerts.

**Components**:
- Tab bar: All | Limit | Anomaly | Read
- `<DataTable>`: Type badge | Unit | Message | Created At | Status | Mark read button
- Pagination

**Behaviour**: "Mark as read" calls PATCH on the alert; row moves to "Read" tab on next
fetch (optimistic update not required — simple refetch after PATCH).

**States**: loading, empty ("No alerts — great job!"), error, populated.

**API calls**:
- `GET /api/v1/alerts`
- `PATCH /api/v1/alerts/:id/read`

---

### P7 — Predictions Page (P2)

**Purpose**: Display the 7-day hourly forecast with confidence band.

**Components**:
- Unit selector
- `<ForecastChart>` — actual (past 7 days, solid blue) + forecast (7 days ahead, dashed
  violet) + uncertainty band (violet, 15% fill opacity)
- Accuracy strip: MAE, MAPE, holdout period, method label

**States**: loading, empty (< 7 days data), error, populated.

**API calls**: `GET /api/v1/predictions/forecast`

---

### P8 — Recommendations Page (P2)

**Purpose**: List all triggered recommendation rules with detail.

**Components**: Vertical list of recommendation cards (icon, title, description,
estimated saving pill, rule rationale).

**States**: loading, empty ("No issues detected — your usage looks great!"), error, populated.

**API calls**: `GET /api/v1/recommendations`

---

### P9 — Reports Page (P2)

**Purpose**: Generate and download CSV reports.

**Components**: Form with unit selector, date range, group-by (hour/day/month), type
(history/summary). "Generate & Download" button.

**API calls**: `GET /api/v1/reports/export`

---

### P10 — Profile Page (P2)

**Purpose**: View profile, change password.

**Components**: Name display (read-only for now), email display, Change Password form.

**API calls**: `GET /api/v1/auth/me`, `PUT /api/v1/auth/change-password`

---

### P11 — Admin Dashboard

**Purpose**: System-wide overview.

**Components**:
- 4 stat cards: Total Units | Active Users | System Month kWh | System Month ₹
- `<DataTable>` Top 5 Consumers (unit, owner, kWh, % of limit)
- Alert feed (all open alerts, newest first)

**API calls**: `GET /api/v1/analytics/admin/overview`, `GET /api/v1/alerts`

---

### P12 — Admin Users

**Purpose**: Manage user accounts.

**Components**: `<DataTable>` with name, email, role, status, created date, actions
(Activate / Deactivate, Edit name). `<Modal>` for edit. `<ConfirmDialog>` for deactivate.

**API calls**: `GET /api/v1/users`, `PATCH /api/v1/users/:id`

---

### P13 — Admin Units

**Purpose**: Manage all units.

**Components**: `<DataTable>` with unit name, building, owner, type, limit, status, actions
(Edit, Deactivate). `<Modal>` for edit (can reassign owner). `<ConfirmDialog>` for deactivate.

**API calls**: `GET /api/v1/units`, `PUT /api/v1/units/:id`, `DELETE /api/v1/units/:id`

---

### P14 — Admin Buildings (P2)

**Components**: CRUD table for buildings.

**API calls**: `GET /api/v1/buildings`, `POST`, `PUT`, `DELETE`

---

### P15 — Admin Settings (P2)

**Purpose**: Edit global settings (tariff slabs, default limit).

**Components**: Form with inline slab editor (add/remove rows), default limit input.
All fields validated before submit. Server errors mapped to fields.

**API calls**: `GET /api/v1/settings`, `PUT /api/v1/settings`

---

### P16 — Admin Energy Monitoring (P2)

**Purpose**: View raw readings across all units.

**Components**: Same as P5 (History) but with admin scope (any unit). Includes CSV import
button.

**API calls**: `GET /api/v1/energy/history`, `POST /api/v1/admin/energy/import`

---

## Shared Interaction Patterns

| Pattern | Behaviour |
|---------|-----------|
| Loading state | Shape-matched skeleton (no spinners on page loads) |
| Empty state | `<EmptyState>` with icon, message, optional CTA |
| Error state | `<ErrorState>` with message and "Try again" button |
| Form submit | Button disabled + loading spinner while request in flight |
| Server error → form | Map `error.details[].field` to field error text |
| 401 anywhere | Clear localStorage, redirect to /login with toast "Session expired" |
| Destructive action | Always requires `<ConfirmDialog>` before proceeding |
| Toast notifications | Success and error toasts for all mutations |
| Navigation active | Sidebar item highlighted for current route |
