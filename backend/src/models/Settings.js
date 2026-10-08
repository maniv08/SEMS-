/**
 * src/models/Settings.js
 * Global settings singleton. Only one document exists in this collection.
 * Per BINDING DECISION 5: tariff slabs are stored here, editable by admin.
 * Per BINDING DECISION 5: cost is computed from current slabs, never stored.
 *
 * The default tariff approximates Indian EB (Electricity Board) residential slabs.
 */
import mongoose from 'mongoose';

const { Schema } = mongoose;

// Sub-schema for one tariff slab
const tariffSlabSchema = new Schema(
  {
    // Upper boundary of this slab in kWh. null = this slab covers all remaining units (∞).
    upToKwh: {
      type: Number,
      default: null,
    },
    // Rate in rupees per kWh for units consumed within this slab
    ratePerKwh: {
      type: Number,
      required: true,
      min: [0.01, 'Rate must be positive'],
    },
  },
  { _id: false }
);

const settingsSchema = new Schema(
  {
    // Default monthly limit applied when creating a new unit (kWh)
    defaultMonthlyLimitKwh: {
      type: Number,
      required: true,
      min: [10, 'Default limit must be at least 10 kWh'],
      default: 300,
    },

    // Indian EB-style progressive tariff slabs (ascending by upToKwh)
    tariffSlabs: {
      type: [tariffSlabSchema],
      required: true,
      default: [
        { upToKwh: 100,  ratePerKwh: 2.50 },
        { upToKwh: 200,  ratePerKwh: 3.25 },
        { upToKwh: 500,  ratePerKwh: 5.00 },
        { upToKwh: null, ratePerKwh: 6.50 }, // last slab = ∞
      ],
    },

    currencySymbol: {
      type: String,
      default: '₹',
    },

    // Admin who last updated the settings
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Settings', settingsSchema);
