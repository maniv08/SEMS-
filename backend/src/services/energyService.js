/**
 * src/services/energyService.js
 * Core logic for energy ingestion and alert checks.
 */
import EnergyRecord from '../models/EnergyRecord.js';
import Unit from '../models/Unit.js';

/**
 * Ingests a single energy reading.
 * @param {Object} data - The reading payload
 * @param {string} data.unitId
 * @param {Date} data.timestamp
 * @param {number} data.kwh
 * @param {string} data.source
 * @param {boolean} [data.isAnomaly=false]
 * @returns {Promise<Object>} The inserted or existing record
 */
export async function ingestReading(data) {
  const { unitId, timestamp, kwh, source, isAnomaly = false } = data;

  const unit = await Unit.findById(unitId).lean();
  if (!unit) {
    throw new Error('Unit not found');
  }

  // Enforce idempotency via unique compound index on { unit, timestamp }
  // Try to create first. If it fails with E11000 duplicate key, catch and return existing.
  try {
    const record = await EnergyRecord.create({
      unit: unit._id,
      building: unit.building,
      owner: unit.owner,
      timestamp,
      kwh,
      source,
      isAnomaly,
    });
    return record;
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate key error, find the existing record and return it
      const existing = await EnergyRecord.findOne({ unit: unit._id, timestamp });
      return existing;
    }
    throw error;
  }
}
