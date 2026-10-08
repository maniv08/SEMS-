import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app.js';
import { connectDB } from '../src/config/db.js';
import User from '../src/models/User.js';
import Building from '../src/models/Building.js';
import Unit from '../src/models/Unit.js';
import EnergyRecord from '../src/models/EnergyRecord.js';
import jwt from 'jsonwebtoken';

const signToken = (id, role) => jwt.sign({ sub: id, role }, process.env.JWT_SECRET, { expiresIn: '1h' });

describe('Analytics API', () => {
  let userToken, testUser, testUnit, mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await connectDB(mongoServer.getUri());
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await EnergyRecord.deleteMany({});
    await Unit.deleteMany({});
    await Building.deleteMany({});
    await User.deleteMany({});

    testUser = await User.create({ name: 'User', email: 'u@e.com', passwordHash: 'x', role: 'user' });
    userToken = signToken(testUser._id, testUser.role);

    const b = await Building.create({ name: 'Building A', address: '12345', createdBy: testUser._id });

    testUnit = await Unit.create({
      name: 'U1',
      building: b._id,
      owner: testUser._id,
      unitType: 'residential',
      monthlyLimitKwh: 300,
    });
  });

  describe('GET /api/v1/analytics/summary', () => {
    it('returns empty summary gracefully with no records', async () => {
      const res = await request(app)
        .get(`/api/v1/analytics/summary?unitId=${testUnit._id}`)
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.data.todayKwh).toBe(0);
      expect(res.body.data.monthKwh).toBe(0);
      expect(res.body.data.todayVsLastWeekSameDayPct).toBe(0);
    });

    it('computes correct summary metrics', async () => {
      // Mock some data. Need it relative to today.
      const nowIst = new Date(Date.now() + 19800000);
      const year = nowIst.getUTCFullYear();
      const month = nowIst.getUTCMonth();
      const date = nowIst.getUTCDate();
      
      const todayStartUtc = new Date(Date.UTC(year, month, date, -5, -30, 0));
      
      await EnergyRecord.create([
        { unit: testUnit._id, building: testUnit.building, owner: testUser._id, timestamp: new Date(todayStartUtc.getTime() + 3600000), kwh: 5, source: 'device' }
      ]);

      const res = await request(app)
        .get(`/api/v1/analytics/summary?unitId=${testUnit._id}`)
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.data.todayKwh).toBe(5);
      expect(res.body.data.monthKwh).toBeGreaterThanOrEqual(5); // could be more if month spans
      expect(res.body.data.monthlyLimitKwh).toBe(300);
    });
  });
});
