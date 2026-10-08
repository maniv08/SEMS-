/**
 * src/config/db.js
 * MongoDB connection via Mongoose.
 * Accepts an optional URI parameter so tests can pass a MongoMemoryServer URI
 * directly, bypassing the env var.
 */
import mongoose from 'mongoose';

/**
 * Connect to MongoDB.
 * @param {string} [uri] - Override URI (used in tests with MongoMemoryServer).
 *                          Defaults to process.env.MONGO_URI.
 */
export async function connectDB(uri) {
  const mongoUri = uri || process.env.MONGO_URI;

  try {
    await mongoose.connect(mongoUri, {});
    console.log('[DB] MongoDB connected');
  } catch (err) {
    console.warn('[DB] Local connection failed:', err.message);
    console.log('[DB] Starting fallback In-Memory Database for demo mode...');
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create();
      const fallbackUri = mongoServer.getUri();
      await mongoose.connect(fallbackUri, {});
      console.log('[DB] MongoDB In-Memory Server connected (Data will not be saved after restart)');
    } catch (fallbackErr) {
      console.error('[DB] Fallback failed:', fallbackErr.message);
      process.exit(1);
    }
  }
}
