/**
 * server.js
 * Entry point. Loads environment, connects to MongoDB, then starts listening.
 * Import order matters: dotenv must run before any module reads process.env.
 */
import 'dotenv/config'; // Must be first — loads .env into process.env
import { connectDB } from './src/config/db.js';
import { env } from './src/config/env.js'; // Validates env vars (exits if missing)
import app from './app.js';

async function startServer() {
  // Connect to MongoDB before accepting requests
  await connectDB();
  const { seedDatabaseIfEmpty } = await import('./src/scripts/seedHelper.js');
  await seedDatabaseIfEmpty();

  app.listen(env.port, async () => {
    console.log(`[Server] Running on port ${env.port} (${env.nodeEnv})`);
    console.log(`[Server] Health: http://localhost:${env.port}/api/v1/health`);

    if (env.simulatorEnabled) {
      console.log('[Simulator] Ticker is ENABLED — will append hourly readings');
      const { startSimulator } = await import('./src/simulator/ticker.js');
      startSimulator();
    }
  });
}

startServer();
