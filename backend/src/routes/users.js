/**
 * src/routes/users.js
 * Admin-only user management routes.
 */
import express from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/requireRole.js';
import catchAsync from '../utils/catchAsync.js';
import { AppError } from '../utils/AppError.js';
import User from '../models/User.js';
import { getPaginationOptions, formatPaginatedResponse } from '../utils/pagination.js';

const router = express.Router();

// All users routes require admin role
router.use(authenticate);
router.use(requireRole(['admin']));

// GET /api/v1/users
router.get(
  '/',
  catchAsync(async (req, res) => {
    const { limit, skip, page } = getPaginationOptions(req.query);
    const { search, isActive } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const [items, total] = await Promise.all([
      User.find(query)
        .select('-passwordHash')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: formatPaginatedResponse(items, total, { limit, page }),
    });
  })
);

// GET /api/v1/users/:id
router.get(
  '/:id',
  catchAsync(async (req, res) => {
    const user = await User.findById(req.params.id).select('-passwordHash').lean();

    if (!user) {
      throw new AppError('User not found', 404, 'NOT_FOUND');
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  })
);

// PATCH /api/v1/users/:id
router.patch(
  '/:id',
  catchAsync(async (req, res) => {
    // Admin can update name, isActive. Cannot change email or role via this endpoint.
    const { name, isActive } = req.body;
    
    // Build update object based on allowed fields provided
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (isActive !== undefined) updateData.isActive = isActive;

    const user = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    }).select('-passwordHash');

    if (!user) {
      throw new AppError('User not found', 404, 'NOT_FOUND');
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  })
);

export default router;
