/**
 * src/scripts/seedAdmin.js
 * Creates the admin account from environment variables.
 * Run with: npm run seed:admin
 *
 * Per BINDING DECISION 6: admin accounts are ONLY created this way.
 * The public /register endpoint always creates role='user'.
 * Running this script again with the same email is safe (idempotent — skips if exists).
 */
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import User from '../models/User.js';

async function seedAdmin() {
  // Validate required env vars for this script
  const required = ['MONGO_URI', 'ADMIN_NAME', 'ADMIN_EMAIL', 'ADMIN_PASSWORD'];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    console.error('[seed:admin] Missing env vars:', missing.join(', '));
    process.exit(1);
  }

  const { MONGO_URI, ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

  try {
    await mongoose.connect(MONGO_URI);
    console.log('[seed:admin] Connected to MongoDB');

    // Check if admin already exists (idempotent)
    const existing = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() });
    if (existing) {
      console.log(`[seed:admin] Admin already exists: ${ADMIN_EMAIL}`);
      console.log('[seed:admin] Done (no changes made)');
      await mongoose.disconnect();
      return;
    }

    // Create admin user
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
    const admin = await User.create({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL.toLowerCase(),
      passwordHash,
      role: 'admin', // Only place where role='admin' is set
      isActive: true,
    });

    console.log('[seed:admin] ✅ Admin account created successfully');
    console.log('  Name  :', admin.name);
    console.log('  Email :', admin.email);
    // Do NOT log the password — only acknowledge it was set
    console.log('  Pass  : (set from ADMIN_PASSWORD env var)');
  } catch (err) {
    console.error('[seed:admin] Error:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

seedAdmin();
