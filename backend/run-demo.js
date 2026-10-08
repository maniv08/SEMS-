import 'dotenv/config';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

process.env.NODE_ENV = 'development';
process.env.PORT = '5000';
process.env.MONGO_URI = 'mongodb://localhost:27017/placeholder';
process.env.JWT_SECRET = 'demo_secret_key_which_needs_to_be_long_enough';
process.env.CORS_ORIGIN = 'http://localhost:5173';
process.env.SIMULATOR_ENABLED = 'true';

import app from './app.js';
import { generateSimulatorData } from './src/scripts/seedData.js';
import User from './src/models/User.js';
import bcrypt from 'bcryptjs';

async function runDemo() {
  console.log('--- STARTING DEMO MODE ---');
  console.log('1. Booting In-Memory MongoDB...');
  const mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  
  await mongoose.connect(uri, {});
  console.log('2. Connected to In-Memory DB');

  console.log('3. Seeding Admin and User Accounts...');
  const adminPassword = await bcrypt.hash('demo123', 10);
  await User.create([
    { name: 'Admin', email: 'admin@demo.com', passwordHash: adminPassword, role: 'admin' },
    { name: 'Demo User', email: 'user@demo.com', passwordHash: adminPassword, role: 'user' }
  ]);
  
  console.log('4. Seeding Energy Data (This might take a few seconds)...');
  await generateSimulatorData();

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log('----------------------------------------------------');
    console.log(`✅ DEMO SERVER RUNNING ON http://localhost:${PORT}`);
    console.log('----------------------------------------------------');
    console.log('You can now log in at the frontend using:');
    console.log('Admin: admin@demo.com / demo123');
    console.log('User: user@demo.com / demo123');
  });
}

runDemo().catch(console.error);
