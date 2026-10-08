/**
 * src/routes/auth.js
 * Authentication routes: register, login, /me, change-password.
 *
 * Per BINDING DECISION 6: register always creates role='user'.
 * Per SECURITY.md: bcrypt cost 12, JWT 1h, generic "Invalid credentials" message.
 * Per AGENTS.md Rule 7: every route validates input with zod.
 */
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import User from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import { authenticate } from '../middleware/authenticate.js';
import { env } from '../config/env.js';

const router = express.Router();

// --- Rate limiter: 10 requests per 15 minutes per IP ---
// Skipped in test environment so tests don't interfere with each other.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Too many requests. Please try again later.' },
  },
});

// --- Zod validation schemas ---

const registerSchema = z.object({
  name: z.string({ required_error: 'Name is required' })
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters')
    .trim(),
  email: z.string({ required_error: 'Email is required' })
    .email('Invalid email format')
    .toLowerCase(),
  password: z.string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one digit'),
});

const loginSchema = z.object({
  email: z.string({ required_error: 'Email is required' })
    .email('Invalid email format')
    .toLowerCase(),
  password: z.string({ required_error: 'Password is required' })
    .min(1, 'Password is required'),
});

const changePasswordSchema = z.object({
  currentPassword: z.string({ required_error: 'Current password is required' })
    .min(1, 'Current password is required'),
  newPassword: z.string({ required_error: 'New password is required' })
    .min(8, 'New password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one digit'),
});

// --- Helper: build and return a Zod validation error response ---
function validationError(res, zodError) {
  return res.status(400).json({
    success: false,
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Invalid input',
      details: zodError.errors.map((e) => ({
        field: e.path.join('.') || 'unknown',
        message: e.message,
      })),
    },
  });
}

// --- Helper: sign a JWT ---
function signToken(userId, role) {
  return jwt.sign(
    { sub: userId.toString(), role },
    env.jwtSecret,
    { expiresIn: '1h' }
  );
}

// =============================================================================
// POST /api/v1/auth/register
// Creates a new user. Role is ALWAYS 'user' regardless of request body.
// =============================================================================
router.post('/register', authLimiter, catchAsync(async (req, res) => {
  // 1. Validate input
  const result = registerSchema.safeParse(req.body);
  if (!result.success) return validationError(res, result.error);
  const { name, email, password } = result.data;

  // 2. Check for duplicate email
  const existing = await User.findOne({ email });
  if (existing) {
    throw new AppError('Email already registered', 409, 'CONFLICT');
  }

  // 3. Hash password (bcrypt cost 12 per SECURITY.md)
  const passwordHash = await bcrypt.hash(password, 12);

  // 4. Create user — role is hardcoded 'user'; Mongoose strict mode ignores extra fields
  const user = await User.create({ name, email, passwordHash, role: 'user' });

  // 5. Issue JWT
  const token = signToken(user._id, user.role);

  const userObj = user.toObject();
  delete userObj.passwordHash;

  return res.status(201).json({
    success: true,
    data: { token, user: userObj },
    message: 'Registration successful',
  });
}));

// =============================================================================
// POST /api/v1/auth/login
// =============================================================================
router.post('/login', authLimiter, catchAsync(async (req, res) => {
  // 1. Validate input
  const result = loginSchema.safeParse(req.body);
  if (!result.success) return validationError(res, result.error);
  const { email, password } = result.data;

  // 2. Always the same error message — prevents user enumeration attacks
  const INVALID_CREDS = {
    success: false,
    error: { code: 'UNAUTHORIZED', message: 'Invalid credentials' },
  };

  // 3. Find user and load passwordHash (excluded by default)
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user || !user.isActive) {
    return res.status(401).json(INVALID_CREDS);
  }

  // 4. Compare password
  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    return res.status(401).json(INVALID_CREDS);
  }

  // 5. Issue JWT
  const token = signToken(user._id, user.role);

  // 6. Return user without passwordHash (toJSON transform strips it)
  const userObj = user.toObject();
  delete userObj.passwordHash;

  return res.status(200).json({
    success: true,
    data: { token, user: userObj },
  });
}));

// =============================================================================
// GET /api/v1/auth/me
// Returns the currently authenticated user's profile.
// =============================================================================
router.get('/me', authenticate, catchAsync(async (req, res) => {
  // req.user is already the full user document (set by authenticate middleware)
  return res.status(200).json({
    success: true,
    data: req.user,
  });
}));

// =============================================================================
// PUT /api/v1/auth/change-password
// =============================================================================
router.put('/change-password', authenticate, catchAsync(async (req, res) => {
  // 1. Validate input
  const result = changePasswordSchema.safeParse(req.body);
  if (!result.success) return validationError(res, result.error);
  const { currentPassword, newPassword } = result.data;

  // 2. Load user with passwordHash
  const user = await User.findById(req.user._id).select('+passwordHash');

  // 3. Verify current password
  const match = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!match) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Current password is incorrect' },
    });
  }

  // 4. Hash and save new password
  user.passwordHash = await bcrypt.hash(newPassword, 12);
  await user.save();

  return res.status(200).json({
    success: true,
    message: 'Password updated successfully',
  });
}));

export default router;
