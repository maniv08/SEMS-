import request from 'supertest';
import app from '../app.js';
import User from '../src/models/User.js';
import Settings from '../src/models/Settings.js';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connectDB } from '../src/config/db.js';

const signToken = (id, role) => jwt.sign({ sub: id, role }, process.env.JWT_SECRET, { expiresIn: '1h' });

describe('Settings API', () => {
  let adminToken, userToken, mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await connectDB(mongoServer.getUri());
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await Settings.deleteMany({});
    await User.deleteMany({});
    
    const adminUser = await User.create({ name: 'Admin', email: 'admin@s.com', passwordHash: 'pwd', role: 'admin' });
    adminToken = signToken(adminUser._id, adminUser.role);

    const testUser = await User.create({ name: 'User', email: 'user@s.com', passwordHash: 'pwd', role: 'user' });
    userToken = signToken(testUser._id, testUser.role);
  });

  describe('GET /api/v1/settings', () => {
    it('returns default settings if none exist', async () => {
      const res = await request(app)
        .get('/api/v1/settings')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.data.defaultMonthlyLimitKwh).toBe(300);
      expect(res.body.data.currencySymbol).toBe('₹');
    });

    it('returns 403 for user role', async () => {
      const res = await request(app)
        .get('/api/v1/settings')
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(res.status).toBe(403);
    });
  });

  describe('PUT /api/v1/settings', () => {
    it('updates settings', async () => {
      const res = await request(app)
        .put('/api/v1/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ defaultMonthlyLimitKwh: 500 });
      
      expect(res.status).toBe(200);
      expect(res.body.data.defaultMonthlyLimitKwh).toBe(500);
    });
  });
});
