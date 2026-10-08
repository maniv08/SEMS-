/**
 * jest.config.js
 * Jest configuration for ESM (ES modules) support.
 * Uses --experimental-vm-modules (Node 18+ built-in).
 */
export default {
  // Run in Node.js environment (not browser/jsdom)
  testEnvironment: 'node',

  // Set env vars BEFORE any test file is imported (avoids env validation crash)
  setupFiles: ['./jest.setup.js'],

  // Test file pattern
  testMatch: ['**/__tests__/**/*.test.js'],

  // Show test names inline
  verbose: true,

  // Collect coverage from src/
  collectCoverageFrom: ['src/**/*.js', '!src/scripts/**'],

  // Increase timeout for mongodb-memory-server
  testTimeout: 30000,
};
