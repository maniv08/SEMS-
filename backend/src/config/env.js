/**
 * src/config/env.js
 * Validates required environment variables at startup.
 * If any are missing, the process exits immediately with a clear message.
 * This prevents cryptic runtime errors caused by missing secrets.
 */

const REQUIRED_VARS = ['PORT', 'MONGO_URI', 'JWT_SECRET', 'CORS_ORIGIN'];

const missing = REQUIRED_VARS.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error('\n[ERROR] Missing required environment variables:');
  missing.forEach((key) => console.error(`  - ${key}`));
  console.error('\nCopy .env.example to .env and fill in all values.\n');
  process.exit(1);
}

// Export validated, typed config
export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  corsOrigin: process.env.CORS_ORIGIN,
  simulatorEnabled: process.env.SIMULATOR_ENABLED === 'true',
};
