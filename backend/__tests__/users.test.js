import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app.js';
import User from '../src/models/User.js';
import jwt from 'jsonwebtoken';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connectDB } from '../src/config/db.js';

const signToken = (id, role) => jwt.sign({ sub: id, role }, process.env.JWT_SECRET, { expiresIn: '1h' });

describe('Users API', () => {
  let adminToken, userToken, testUser, adminUser, mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await connectDB(mongoServer.getUri());
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    
    adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      passwordHash: 'hashedpassword',
      role: 'admin',
    });
    adminToken = signToken(adminUser._id, adminUser.role);

    testUser = await User.create({
      name: 'Test User',
      email: 'user@example.com',
      passwordHash: 'hashedpassword',
      role: 'user',
    });
    userToken = signToken(testUser._id, testUser.role);
  });

  describe('GET /api/v1/users', () => {
    it('returns 200 and list of users for admin', async () => {
      const res = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items.length).toBe(2);
      expect(res.body.data.items[0].passwordHash).toBeUndefined();
    });

    it('returns 403 for non-admin', async () => {
      const res = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe('PATCH /api/v1/users/:id', () => {
    it('allows admin to update user name and isActive', async () => {
      const res = await request(app)
        .patch(`/api/v1/users/${testUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated Name', isActive: false });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Updated Name');
      expect(res.body.data.isActive).toBe(false);

      const dbUser = await User.findById(testUser._id);
      expect(dbUser.name).toBe('Updated Name');
      expect(dbUser.isActive).toBe(false);
    });

    it('ignores attempts to update email or role', async () => {
      const res = await request(app)
        .patch(`/api/v1/users/${testUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: 'hacked@example.com', role: 'admin' });

      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe(testUser.email);
      expect(res.body.data.role).toBe('user');
    });
  });
});
