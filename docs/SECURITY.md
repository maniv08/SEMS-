# Security Design
# Smart Energy Management System

**Version**: 1.0  
**Read before**: Stage 1, 2, 9

---

## 1. Authentication

### JWT
- Algorithm: HS256.
- Expiry: 1 hour (`expiresIn: "1h"`).
- Secret: `JWT_SECRET` from `.env` (min 32 characters, random hex recommended).
- Payload: `{ sub: userId, role, iat, exp }`. No sensitive data in payload.
- Storage: `localStorage` (frontend). Acceptable trade-off for MVP; documented
  limitation vs HttpOnly cookie. Any 401 response triggers immediate logout + redirect.
- **No refresh token in MVP**. User must re-login after expiry. This is documented.

### bcrypt
- Cost factor: **12** (OWASP recommendation; ~300 ms on a modern laptop — acceptable for
  auth routes which are rate-limited).
- Never log, return, or store the plain password after hashing.
- Generic error message for wrong credentials: `"Invalid credentials"` — same message
  for wrong email and wrong password. Prevents user enumeration.

---

## 2. Authorization

### Middleware chain (applied in order)
```
authenticate → requireRole([...roles]) → checkOwnership
```

### `authenticate` middleware
1. Reads `Authorization: Bearer <token>` header.
2. Verifies JWT signature and expiry.
3. Loads the user from DB (ensures `isActive: true` — deactivated users cannot auth).
4. Attaches `req.user` to the request.
5. On any failure: 401 UNAUTHORIZED.

### `requireRole` middleware
- Checks `req.user.role` against the allowed roles array.
- On failure: 403 FORBIDDEN (not 401 — the user is authenticated but not authorised).

### `checkOwnership` (per-resource function, not a generic middleware)
- For unit queries: `WHERE unit.owner = req.user._id` added to every Mongoose query.
- For energy/alert queries: `WHERE record.owner = req.user._id` added.
- Admin bypasses ownership checks (but still goes through authenticate + requireRole).
- **Implementation**: use a helper `scopeToUser(query, req)` that adds the ownership
  filter if `req.user.role !== "admin"`. Centralised in one function to prevent accidental
  omission.

---

## 3. IDOR Prevention

IDOR (Insecure Direct Object Reference) — a user guessing another user's resource ID.

**Defence strategy**:
- Every resource query includes `owner: req.user._id` in the Mongoose filter (except admin).
- Even if a user guesses the ObjectId of another user's unit, the query returns 404 (not 403,
  to avoid leaking existence information).
- The `scopeToUser` helper is tested with an explicit IDOR test: User A calls
  `GET /api/v1/units/:idOfUserBsUnit` → must return 404.

---

## 4. Input Validation

- All request bodies validated with **zod** schemas before any DB access.
- All query parameters parsed and validated (type coercion, bounds checking).
- Zod errors are caught by the central error handler and returned as
  `400 VALIDATION_ERROR` with field-level detail.
- No `eval()`, no `Function()`, no dynamic queries built from user input.

---

## 5. MongoDB Security

### express-mongo-sanitize
Applied as global middleware. Strips `$` and `.` from request bodies, query strings, and
params to prevent NoSQL injection attacks (e.g. `{ "email": { "$gt": "" } }`).

### Mongoose strict mode
All schemas use `strict: true` (Mongoose default). Fields not in the schema are silently
dropped, preventing mass-assignment attacks (e.g. trying to set `role: "admin"` in the
register body).

---

## 6. HTTP Security Headers

**helmet** is applied as the first global middleware with default settings, providing:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Strict-Transport-Security` (on HTTPS deployments)
- `Content-Security-Policy` (helmet defaults; adjusted if frontend is on a different origin)
- `X-XSS-Protection` (legacy header, still useful)

---

## 7. CORS

- `CORS_ORIGIN` environment variable (comma-separated for multiple origins).
- Applied with `credentials: false` (no cookies in MVP).
- Requests from other origins receive 403.
- **Never use `cors({ origin: "*" })` in production.**

---

## 8. Rate Limiting

Using **express-rate-limit**.

| Route group | Limit | Window |
|-------------|-------|--------|
| `POST /api/v1/auth/register` | 10 req | 15 min |
| `POST /api/v1/auth/login` | 10 req | 15 min |
| `POST /api/v1/energy/ingest` | 60 req | 1 min (per device key) |
| All other routes | 100 req | 1 min |

Rate limit errors return `429 RATE_LIMITED` with `Retry-After` header.

---

## 9. Environment Variables

```
# .env.example (committed to repo)
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/smart-energy
JWT_SECRET=CHANGE_ME_TO_A_RANDOM_32_CHAR_HEX
CORS_ORIGIN=http://localhost:5173
SIMULATOR_ENABLED=false
ADMIN_NAME=Admin
ADMIN_EMAIL=admin@demo.com
ADMIN_PASSWORD=CHANGE_ME_ADMIN_PASS
```

Rules:
- `.env` is in `.gitignore` and never committed.
- On startup, the app validates that all required env vars are present and non-empty.
  If validation fails, the process exits immediately with a clear error message.
- Never log the value of `JWT_SECRET`, `ADMIN_PASSWORD`, or any device key.
- Device keys are stored as SHA-256 hashes. The plain key is printed once at creation
  and never stored anywhere in plain text.

---

## 10. Error Handling

### Central error handler (`backend/src/middleware/errorHandler.js`)
- Catches all errors passed via `next(err)`.
- Logs full stack trace to console (dev) or logger (prod). **Never sends stack traces
  to the client.**
- Maps known error types to response codes:
  - Mongoose `CastError` → 400 VALIDATION_ERROR
  - Mongoose `ValidationError` → 400 VALIDATION_ERROR
  - Mongoose duplicate key (11000) → 409 CONFLICT
  - Zod `ZodError` → 400 VALIDATION_ERROR
  - Custom `AppError` → status from error
  - Anything else → 500 INTERNAL_ERROR (generic message to client)
- 404 handler is registered **after** all routes, before the error handler.

### `AppError` class
```js
class AppError extends Error {
  constructor(message, statusCode, code, details = []) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;     // e.g. "NOT_FOUND"
    this.details = details;
  }
}
```

---

## 11. Common Vulnerabilities Checklist

| Vulnerability | Mitigation |
|---------------|------------|
| SQL/NoSQL injection | Mongoose schemas + express-mongo-sanitize |
| XSS | helmet CSP; React JSX escaping; no dangerouslySetInnerHTML |
| CSRF | Not applicable (no cookies used; Bearer token is not auto-sent by browsers) |
| Broken object-level auth (IDOR) | scopeToUser helper on every query |
| Broken function-level auth | requireRole middleware on every admin route |
| Mass assignment | Mongoose strict mode; explicit field allowlists in PATCH handlers |
| Sensitive data exposure | passwordHash never in API response; device keys hashed; no secrets in git |
| Rate limiting / brute force | express-rate-limit on auth routes |
| Enumeration | Generic "Invalid credentials" message |
| Weak passwords | Zod validation: min 8, ≥1 uppercase, ≥1 digit |

---

## 12. Password Reset (Out of scope for MVP)

No password reset (email not configured). Admin can deactivate an account; the user
contacts admin for a manual reset via `npm run seed:admin` with new credentials.
Documented as a known limitation. Future: nodemailer + time-limited signed reset token.
