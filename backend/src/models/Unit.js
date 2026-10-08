/**
 * src/models/Unit.js
 * An energy-metered unit (flat, office, etc.) within a building.
 * Per DATABASE.md: each unit has exactly one owner and belongs to one building.
 * The deviceKey is stored as a SHA-256 hash; the plain key is shown once at creation.
 */
import mongoose from 'mongoose';

const { Schema } = mongoose;

const unitSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Unit name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },

    building: {
      type: Schema.Types.ObjectId,
      ref: 'Building',
      required: [true, 'Building is required'],
      index: true,  // for building-level queries
    },

    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner is required'],
      index: true,  // for user's units list
    },

    unitType: {
      type: String,
      enum: ['residential', 'commercial', 'common_area'],
      required: [true, 'Unit type is required'],
    },

    // Monthly energy limit in kWh. Alerts trigger at 80% and 100%.
    monthlyLimitKwh: {
      type: Number,
      required: true,
      min: [10, 'Monthly limit must be at least 10 kWh'],
      default: 300,
    },

    // SHA-256 hash of the device's plain key.
    // select: false — not included in responses by default.
    // Sparse index: null values are excluded, so multiple units can have no key.
    deviceKey: {
      type: String,
      select: false,
      index: { unique: true, sparse: true },
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Unit', unitSchema);
