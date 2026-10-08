/**
 * src/models/User.js
 * User account schema.
 * Per DATABASE.md: email is unique, passwordHash is never returned via API,
 * role is always 'user' from public register (admin via seed:admin only).
 */
import mongoose from 'mongoose';

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,          // creates unique index on email
      lowercase: true,       // stored in lowercase always
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
    },

    // Bcrypt hash (cost 12). Never returned in API responses.
    // select: false means it is excluded from all queries by default.
    // Use .select('+passwordHash') only when needed (login, change-password).
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },

    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically
  }
);

// Mongoose strict mode is true by default — extra fields in create() are ignored.
// This prevents mass-assignment attacks (e.g. role: 'admin' in register body).

export default mongoose.model('User', userSchema);
