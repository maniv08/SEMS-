/**
 * jest.setup.js
 * Runs BEFORE each test file is loaded (and before any imports execute).
 * Sets required environment variables so env.js validation passes during tests.
 * Tests use mongodb-memory-server for the actual DB connection — MONGO_URI here
 * is a placeholder that satisfies the startup validator only.
 */
process.env.NODE_ENV = 'test';
process.env.PORT = '5001';
process.env.MONGO_URI = 'mongodb://localhost:27017/test-placeholder';
process.env.JWT_SECRET = 'test_secret_key_that_is_at_least_32_characters_long_for_validation';
process.env.CORS_ORIGIN = 'http://localhost:5173';
process.env.SIMULATOR_ENABLED = 'false';

// Force mongodb-memory-server to download MongoDB 7.0 (compatible with modern Windows + Node.js v26)
process.env.MONGOMS_VERSION = '7.0.14';

import { jest } from '@jest/globals';
jest.setTimeout(30000);
