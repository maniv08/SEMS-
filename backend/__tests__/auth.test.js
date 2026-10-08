/**
 * __tests__/auth.test.js
 * Tests for Stage 1: authentication endpoints and role-based access control.
 *
 * Per docs/TESTING.md: covers all cases in sections 1, 2, and parts of 11.
 * Uses mongodb-memory-server — no external MongoDB needed.
 */
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../app.js';
import { connectDB } from '../src/config/db.js';
import User from '../src/models/User.js';
import bcrypt from 'bcryptjs';

let mongoServer;

// ---------------------------------------------------------------------------
// Setup and teardown
// ---------------------------------------------------------------------------

beforeAll(async () => {
  // Start in-memory MongoDB and connect Mongoose to it
  mongoServer = await MongoMemoryServer.create();
  await connectDB(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  // Clear all collections between tests for isolation
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const VALID_USER = {
  name: 'Ravi Kumar',
  email: 'ravi@example.com',
  password: 'Secret123',
};

/** Register a user and return the response */
async function register(overrides = {}) {
  return request(app)
    .post('/api/v1/auth/register')
    .send({ ...VALID_USER, ...overrides });
}

/** Register then login; returns { token, user } */
async function registerAndLogin(overrides = {}) {
  await register(overrides);
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: overrides.email || VALID_USER.email, password: overrides.password || VALID_USER.password });
  return res.body.data;
}

/** Create an admin user directly in DB (bypasses register route) */
async function createAdmin() {
  const passwordHash = await bcrypt.hash('AdminPass1', 12);
  return User.create({
    name: 'Admin User',
    email: 'admin@example.com',
    passwordHash,
    role: 'admin',
    isActive: true,
  });
}

/** Get admin JWT by logging in */
async function adminToken() {
  await createAdmin();
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'admin@example.com', password: 'AdminPass1' });
  return res.body.data.token;
}

// ---------------------------------------------------------------------------
// 1. Registration tests
// ---------------------------------------------------------------------------

describe('POST /api/v1/auth/register', () => {
  it('succeeds with valid data — returns 201 + token + user (no passwordHash)', async () => {
    const res = await register();

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data.user).toMatchObject({
      name: VALID_USER.name,
      email: VALID_USER.email.toLowerCase(),
      role: 'user',
    });
    // passwordHash must NEVER appear in any API response
    expect(res.body.data.user.passwordHash).toBeUndefined();
  });

  it('always creates role="user" even if request body contains role="admin"', async () => {
    const res = await register({ role: 'admin' });

    expect(res.status).toBe(201);
    expect(res.body.data.user.role).toBe('user');
  });

  it('returns 409 CONFLICT for duplicate email', async () => {
    await register(); // first registration
    const res = await register(); // second with same email

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('returns 400 VALIDATION_ERROR for missing name', async () => {
    const res = await register({ name: '' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.some((d) => d.field === 'name')).toBe(true);
  });

  it('returns 400 for invalid email format', async () => {
    const res = await register({ email: 'not-an-email' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 for password shorter than 8 characters', async () => {
    const res = await register({ password: 'Ab1' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 for password with no uppercase letter', async () => {
    const res = await register({ password: 'secret123' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 for password with no digit', async () => {
    const res = await register({ password: 'SecretNoDigits' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('stores email in lowercase regardless of input casing', async () => {
    const res = await register({ email: 'RAVI@EXAMPLE.COM' });

    expect(res.status).toBe(201);
    expect(res.body.data.user.email).toBe('ravi@example.com');
  });
});

// ---------------------------------------------------------------------------
// 2. Login tests
// ---------------------------------------------------------------------------

describe('POST /api/v1/auth/login', () => {
  beforeEach(async () => {
    await register(); // seed one user for login tests
  });

  it('succeeds with correct credentials — returns 200 + token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: VALID_USER.email, password: VALID_USER.password });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data.user.passwordHash).toBeUndefined();
  });

  it('returns 401 with SAME message for wrong password (no enumeration)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: VALID_USER.email, password: 'WrongPass1' });

    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe('Invalid credentials');
  });

  it('returns 401 with SAME message for non-existent email (no enumeration)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nobody@example.com', password: 'Secret123' });

    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe('Invalid credentials');
    // Both wrong-password and wrong-email must return identical messages
  });

  it('returns 400 for missing email field', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ password: 'Secret123' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 401 for deactivated user', async () => {
    await User.findOneAndUpdate({ email: VALID_USER.email }, { isActive: false });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: VALID_USER.email, password: VALID_USER.password });

    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// 3. GET /me tests
// ---------------------------------------------------------------------------

describe('GET /api/v1/auth/me', () => {
  it('returns 200 + user data with valid token', async () => {
    const { token } = await registerAndLogin();

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(VALID_USER.email);
    expect(res.body.data.passwordHash).toBeUndefined();
  });

  it('returns 401 when no Authorization header is sent', async () => {
    const res = await request(app).get('/api/v1/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 401 for a malformed token (not a valid JWT)', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer this-is-not-a-jwt');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 401 for an expired token', async () => {
    // Create a token with exp set 1 hour in the past
    const expiredToken = jwt.sign(
      {
        sub: new mongoose.Types.ObjectId().toString(),
        role: 'user',
        exp: Math.floor(Date.now() / 1000) - 3600, // expired 1 hour ago
      },
      process.env.JWT_SECRET
    );

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${expiredToken}`);

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 401 for a token signed with a wrong secret', async () => {
    const wrongToken = jwt.sign(
      { sub: new mongoose.Types.ObjectId().toString(), role: 'user' },
      'completely-wrong-secret'
    );

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${wrongToken}`);

    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// 4. Change password tests
// ---------------------------------------------------------------------------

describe('PUT /api/v1/auth/change-password', () => {
  let token;

  beforeEach(async () => {
    const data = await registerAndLogin();
    token = data.token;
  });

  it('succeeds with correct current password and valid new password', async () => {
    const res = await request(app)
      .put('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: VALID_USER.password, newPassword: 'NewPass456' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify new password works for login
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: VALID_USER.email, password: 'NewPass456' });
    expect(loginRes.status).toBe(200);
  });

  it('returns 401 for wrong current password', async () => {
    const res = await request(app)
      .put('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'WrongOld123', newPassword: 'NewPass456' });

    expect(res.status).toBe(401);
  });

  it('returns 400 for weak new password (no digit)', async () => {
    const res = await request(app)
      .put('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: VALID_USER.password, newPassword: 'WeakPasswordNoDigit' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 401 when no token is provided', async () => {
    const res = await request(app)
      .put('/api/v1/auth/change-password')
      .send({ currentPassword: VALID_USER.password, newPassword: 'NewPass456' });

    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// 5. Role authorization tests
// ---------------------------------------------------------------------------

describe('Role Authorization', () => {
  it('user hitting admin-only route GET /api/v1/users returns 403 FORBIDDEN', async () => {
    const { token } = await registerAndLogin();

    const res = await request(app)
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('admin can access GET /api/v1/users and gets 200', async () => {
    const token = await adminToken();

    const res = await request(app)
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('unauthenticated request to admin route returns 401 (not 403)', async () => {
    const res = await request(app).get('/api/v1/users');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });
});

// ---------------------------------------------------------------------------
// 6. Security: mass assignment
// ---------------------------------------------------------------------------

describe('Security: mass assignment prevention', () => {
  it('cannot set role to admin via register body', async () => {
    const res = await register({ role: 'admin' });

    // Should still succeed but with role='user'
    expect(res.status).toBe(201);
    // Check in DB directly
    const dbUser = await User.findOne({ email: VALID_USER.email });
    expect(dbUser.role).toBe('user');
  });

  it('register body fields not in schema are silently ignored', async () => {
    const res = await register({ isActive: false, __v: 999 });

    expect(res.status).toBe(201);
    const dbUser = await User.findOne({ email: VALID_USER.email });
    expect(dbUser.isActive).toBe(true); // default preserved
  });
});
