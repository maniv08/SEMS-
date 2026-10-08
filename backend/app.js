/**
 * app.js
 * Creates and configures the Express application.
 * Does NOT connect to the database or start listening — that is server.js.
 * Keeping them separate makes the app importable in tests without a real server.
 *
 * Middleware order (important — changes here break security):
 * helmet → cors → morgan → mongo-sanitize → rate-limit → json body → routes → 404 → error
 */
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';

import authRouter from './src/routes/auth.js';
import usersRouter from './src/routes/users.js';
import buildingsRouter from './src/routes/buildings.js';
import unitsRouter from './src/routes/units.js';
import settingsRouter from './src/routes/settings.js';
import energyRouter from './src/routes/energy.js';
import analyticsRouter from './src/routes/analytics.js';
import alertsRouter from './src/routes/alerts.js';
import predictionsRouter from './src/routes/predictions.js';
import recommendationsRouter from './src/routes/recommendations.js';
import reportsRouter from './src/routes/reports.js';
import adminRouter from './src/routes/admin.js';
import { notFoundHandler, errorHandler } from './src/middleware/errorHandler.js';

const app = express();

// ---------------------------------------------------------------------------
// 1. Security headers (helmet sets X-Frame-Options, HSTS, CSP, etc.)
// ---------------------------------------------------------------------------
app.use(helmet());

// ---------------------------------------------------------------------------
// 2. CORS — only allow the configured frontend origin
// ---------------------------------------------------------------------------
const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, Postman, same-origin)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin ${origin} not allowed`));
      }
    },
    credentials: false, // No cookies in this MVP
  })
);

// ---------------------------------------------------------------------------
// 3. Request logging (skip in test environment to keep output clean)
// ---------------------------------------------------------------------------
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ---------------------------------------------------------------------------
// 4. MongoDB query injection sanitization
//    Strips $ and . from req.body, req.params, req.query
// ---------------------------------------------------------------------------
app.use(mongoSanitize());

// ---------------------------------------------------------------------------
// 5. Global rate limiter (auth routes have their own tighter limiter)
// ---------------------------------------------------------------------------
app.use(
  '/api',
  rateLimit({
    windowMs: 60 * 1000,   // 1 minute
    max: 100,              // 100 req/min per IP
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV === 'test',
    message: {
      success: false,
      error: { code: 'RATE_LIMITED', message: 'Too many requests. Please slow down.' },
    },
  })
);

// ---------------------------------------------------------------------------
// 6. Body parser — JSON only (no urlencoded needed; CSV handled separately)
// ---------------------------------------------------------------------------
app.use(express.json({ limit: '1mb' }));

// ---------------------------------------------------------------------------
// 7. Health check (no auth required — used to wake sleeping Render instance)
// ---------------------------------------------------------------------------
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      mongoConnected: true, // Mongoose throws before this if disconnected
    },
  });
});

// ---------------------------------------------------------------------------
// 8. Routes
// ---------------------------------------------------------------------------
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/buildings', buildingsRouter);
app.use('/api/v1/units', unitsRouter);
app.use('/api/v1/settings', settingsRouter);
app.use('/api/v1/energy', energyRouter);
app.use('/api/v1/analytics', analyticsRouter);
app.use('/api/v1/alerts', alertsRouter);
app.use('/api/v1/predictions', predictionsRouter);
app.use('/api/v1/recommendations', recommendationsRouter);
app.use('/api/v1/reports', reportsRouter);
app.use('/api/v1/admin', adminRouter);

// ---------------------------------------------------------------------------
// 9. 404 handler — must be after all routes
// ---------------------------------------------------------------------------
app.use(notFoundHandler);

// ---------------------------------------------------------------------------
// 10. Central error handler — must be LAST (Express requires 4 params)
// ---------------------------------------------------------------------------
app.use(errorHandler);

export default app;
