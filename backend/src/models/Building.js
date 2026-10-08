/**
 * src/models/Building.js
 * A building that contains one or more units.
 * Per DATABASE.md: only admin can create buildings.
 * Per BINDING DECISION 1: admin creates buildings; users cannot.
 */
import mongoose from 'mongoose';

const { Schema } = mongoose;

const buildingSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Building name is required'],
      unique: true,
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },

    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
      minlength: [5, 'Address must be at least 5 characters'],
      maxlength: [300, 'Address cannot exceed 300 characters'],
    },

    // Admin user who created this building
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Building', buildingSchema);
