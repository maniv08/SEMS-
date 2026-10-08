/**
 * src/middleware/authenticate.js
 * Verifies the JWT from the Authorization header and attaches req.user.
 * Any route that requires a logged-in user must use this middleware.
 *
 * Per SECURITY.md: deactivated users (isActive=false) cannot authenticate.
 */
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { env } from '../config/env.js';

/**
 * Middleware: authenticate
 * Reads Bearer token, verifies signature + expiry, loads user from DB.
 * Sets req.user = { _id, name, email, role, isActive }.
 * On any failure: returns 401 UNAUTHORIZED.
 */
export async function authenticate(req, res, next) {
  try {
    // 1. Extract token from "Authorization: Bearer <token>" header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    const token = authHeader.split(' ')[1];

    // 2. Verify JWT signature and expiry
    let payload;
    try {
      payload = jwt.verify(token, env.jwtSecret);
    } catch {
      // Covers: expired, malformed, wrong signature
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' },
      });
    }

    // 3. Load user from DB (confirms user still exists and is active)
    const user = await User.findById(payload.sub);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'User account not found or deactivated' },
      });
    }

    // 4. Attach user to request for downstream middleware/routes
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}
