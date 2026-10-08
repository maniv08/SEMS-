/**
 * src/models/EnergyRecord.js
 */
import mongoose from 'mongoose';

const energyRecordSchema = new mongoose.Schema(
  {
    unit: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit', required: true },
    building: { type: mongoose.Schema.Types.ObjectId, ref: 'Building', required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    timestamp: { type: Date, required: true },
    kwh: { type: Number, required: true, min: 0 },
    isAnomaly: { type: Boolean, required: true, default: false },
    anomalyScore: { type: Number },
    source: {
      type: String,
      required: true,
      enum: ['simulator', 'seed', 'device', 'csv_import'],
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } } // No updatedAt for records
);

// Indexes (critical for performance)
energyRecordSchema.index({ unit: 1, timestamp: -1 }, { unique: true });
energyRecordSchema.index({ building: 1, timestamp: -1 });
energyRecordSchema.index({ owner: 1, timestamp: -1 });
energyRecordSchema.index({ isAnomaly: 1, timestamp: -1 });

export default mongoose.model('EnergyRecord', energyRecordSchema);
