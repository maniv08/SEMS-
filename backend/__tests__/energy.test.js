import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app.js';
import { connectDB } from '../src/config/db.js';
import User from '../src/models/User.js';
import Building from '../src/models/Building.js';
import Unit from '../src/models/Unit.js';
import EnergyRecord from '../src/models/EnergyRecord.js';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const signToken = (id, role) => jwt.sign({ sub: id, role }, process.env.JWT_SECRET, { expiresIn: '1h' });

describe('Energy API', () => {
  let adminToken, userToken, testUser, adminUser, testUnit, deviceKeyPlain, mongoServer;

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

    adminUser = await User.create({ name: 'Admin', email: 'a@e.com', passwordHash: 'x', role: 'admin' });
    adminToken = signToken(adminUser._id, adminUser.role);

    testUser = await User.create({ name: 'User', email: 'u@e.com', passwordHash: 'x', role: 'user' });
    userToken = signToken(testUser._id, testUser.role);

    const b = await Building.create({ name: 'Building B', address: '12345', createdBy: adminUser._id });

    deviceKeyPlain = 'test_key_123';
    const hash = crypto.createHash('sha256').update(deviceKeyPlain).digest('hex');

    testUnit = await Unit.create({
      name: 'U1',
      building: b._id,
      owner: testUser._id,
      unitType: 'residential',
      monthlyLimitKwh: 300,
      deviceKey: hash,
    });
  });

  describe('POST /api/v1/energy/ingest', () => {
    it('allows ingest with valid device key', async () => {
      const res = await request(app)
        .post('/api/v1/energy/ingest')
        .set('x-device-key', deviceKeyPlain)
        .send({
          unitId: testUnit._id.toString(),
          timestamp: '2026-10-02T14:00:00.000Z',
          kwh: 1.5,
          source: 'device'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.kwh).toBe(1.5);
    });

    it('rejects invalid device key', async () => {
      const res = await request(app)
        .post('/api/v1/energy/ingest')
        .set('x-device-key', 'wrong_key')
        .send({
          unitId: testUnit._id.toString(),
          timestamp: '2026-10-02T14:00:00.000Z',
          kwh: 1.5,
          source: 'device'
        });

      expect(res.status).toBe(401);
    });

    it('is idempotent (returns 200 with existing record for duplicate timestamp)', async () => {
      await request(app)
        .post('/api/v1/energy/ingest')
        .set('x-device-key', deviceKeyPlain)
        .send({ unitId: testUnit._id.toString(), timestamp: '2026-10-02T14:00:00.000Z', kwh: 1.5, source: 'device' });

      const res2 = await request(app)
        .post('/api/v1/energy/ingest')
        .set('x-device-key', deviceKeyPlain)
        .send({ unitId: testUnit._id.toString(), timestamp: '2026-10-02T14:00:00.000Z', kwh: 2.0, source: 'device' });

      expect(res2.status).toBe(200);
      expect(res2.body.data.kwh).toBe(1.5); // returns original record, ignores the 2.0
    });
  });

  describe('GET /api/v1/energy/history', () => {
    beforeEach(async () => {
      await EnergyRecord.create([
        { unit: testUnit._id, building: testUnit.building, owner: testUser._id, timestamp: new Date('2026-10-02T10:00:00Z'), kwh: 1, source: 'simulator' },
        { unit: testUnit._id, building: testUnit.building, owner: testUser._id, timestamp: new Date('2026-10-02T11:00:00Z'), kwh: 2, source: 'simulator', isAnomaly: true },
      ]);
    });

    it('returns history for user', async () => {
      const res = await request(app)
        .get(`/api/v1/energy/history?unitId=${testUnit._id}`)
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBe(2);
    });

    it('filters by anomaly', async () => {
      const res = await request(app)
        .get(`/api/v1/energy/history?unitId=${testUnit._id}&anomalyOnly=true`)
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBe(1);
      expect(res.body.data.items[0].kwh).toBe(2);
    });
  });

  describe('GET /api/v1/energy/export', () => {
    beforeEach(async () => {
      await EnergyRecord.create([
        { unit: testUnit._id, building: testUnit.building, owner: testUser._id, timestamp: new Date('2026-10-02T10:00:00Z'), kwh: 1.5, source: 'simulator' }
      ]);
    });

    it('downloads CSV', async () => {
      const res = await request(app)
        .get(`/api/v1/energy/export?unitId=${testUnit._id}`)
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('text/csv');
      expect(res.text).toContain('timestamp_ist,kwh,is_anomaly,source');
      expect(res.text).toContain('1.5,false,simulator');
    });
  });
});
