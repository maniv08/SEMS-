/**
 * src/models/Alert.js
 */
import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema(
  {
    unit: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit', required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    building: { type: mongoose.Schema.Types.ObjectId, ref: 'Building', required: true },
    type: {
      type: String,
      required: true,
      enum: ['limit_80', 'limit_100', 'anomaly']
    },
    status: {
      type: String,
      required: true,
      enum: ['open', 'read'],
      default: 'open'
    },
    message: { type: String, required: true },
    relatedRecord: { type: mongoose.Schema.Types.ObjectId, ref: 'EnergyRecord' },
    period: { type: String }, // "2026-10"
    dayKey: { type: String }, // "2026-10-02"
  },
  { timestamps: true }
);

alertSchema.index({ owner: 1, status: 1, createdAt: -1 });
alertSchema.index({ unit: 1, type: 1, period: 1 });
alertSchema.index({ unit: 1, type: 1, dayKey: 1 });

export default mongoose.model('Alert', alertSchema);
