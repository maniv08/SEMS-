/**
 * src/middleware/errorHandler.js
 * Central error handler. Registered LAST in app.js, after all routes.
 * All errors passed via next(err) arrive here.
 *
 * Per SECURITY.md: stack traces are logged but NEVER sent to the client.
 * Per AGENTS.md Rule 8: all errors use the standard envelope format.
 */
import mongoose from 'mongoose';
import { AppError } from '../utils/AppError.js';

/**
 * 404 handler — registered after all routes to catch unmatched paths.
 */
export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} not found`,
    },
  });
}

/**
 * Central error handler middleware (must have 4 parameters).
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  // Always log the full error server-side (with stack in dev)
  if (process.env.NODE_ENV !== 'test') {
    console.error('[ERROR]', err.message);
    if (process.env.NODE_ENV === 'development') {
      console.error(err.stack);
    }
  }

  // --- Known operational errors (AppError) ---
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
  }

  // --- Mongoose CastError (invalid ObjectId in URL params) ---
  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: `Invalid value for field '${err.path}'`,
        details: [],
      },
    });
  }

  // --- Mongoose ValidationError (schema-level validation) ---
  if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Validation failed', details },
    });
  }

  // --- MongoDB duplicate key (index violation) ---
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return res.status(409).json({
      success: false,
      error: {
        code: 'CONFLICT',
        message: `A record with this ${field} already exists`,
        details: [],
      },
    });
  }

  // --- Unexpected error (bug) — generic message to client ---
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred. Please try again.',
      details: [],
    },
  });
}
