import request from 'supertest';
import app from '../app.js';
import User from '../src/models/User.js';
import Building from '../src/models/Building.js';
import Unit from '../src/models/Unit.js';
import Settings from '../src/models/Settings.js';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connectDB } from '../src/config/db.js';

const signToken = (id, role) => jwt.sign({ sub: id, role }, process.env.JWT_SECRET, { expiresIn: '1h' });

describe('Units API', () => {
  let adminToken, userToken, testUser, adminUser, testBuilding, mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await connectDB(mongoServer.getUri());
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await Unit.deleteMany({});
    await Building.deleteMany({});
    await User.deleteMany({});
    await Settings.deleteMany({});

    await Settings.create({ defaultMonthlyLimitKwh: 200, tariffSlabs: [{upToKwh: null, ratePerKwh: 5}] });
    
    adminUser = await User.create({ name: 'Admin', email: 'admin@u.com', passwordHash: 'pwd', role: 'admin' });
    adminToken = signToken(adminUser._id, adminUser.role);

    testUser = await User.create({ name: 'User', email: 'user@u.com', passwordHash: 'pwd', role: 'user' });
    userToken = signToken(testUser._id, testUser.role);

    testBuilding = await Building.create({ name: 'Tower', address: '123 Main St', createdBy: adminUser._id });
  });

  describe('POST /api/v1/units', () => {
    it('creates unit for user and returns deviceKeyPlain', async () => {
      const res = await request(app)
        .post('/api/v1/units')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Flat 1',
          building: testBuilding._id,
          unitType: 'residential'
        });
      
      expect(res.status).toBe(201);
      expect(res.body.data.unit.name).toBe('Flat 1');
      expect(res.body.data.unit.owner).toBe(testUser._id.toString());
      expect(res.body.data.unit.monthlyLimitKwh).toBe(200); // from settings
      expect(res.body.data.deviceKeyPlain).toBeDefined();
    });

    it('prevents user from creating unit for another owner', async () => {
      const res = await request(app)
        .post('/api/v1/units')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Flat 2',
          building: testBuilding._id,
          unitType: 'residential',
          owner: adminUser._id // trying to assign to admin
        });
      
      expect(res.status).toBe(403);
    });

    it('allows admin to create unit for another owner', async () => {
      const res = await request(app)
        .post('/api/v1/units')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Flat 3',
          building: testBuilding._id,
          unitType: 'residential',
          owner: testUser._id
        });
      
      expect(res.status).toBe(201);
      expect(res.body.data.unit.owner).toBe(testUser._id.toString());
    });
  });

  describe('PUT /api/v1/units/:id', () => {
    let testUnit;
    beforeEach(async () => {
      testUnit = await Unit.create({
        name: 'My Flat',
        building: testBuilding._id,
        owner: testUser._id,
        unitType: 'residential',
        monthlyLimitKwh: 300,
      });
    });

    it('user can update name and limit', async () => {
      const res = await request(app)
        .put(`/api/v1/units/${testUnit._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'New Name', monthlyLimitKwh: 400 });
      
      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('New Name');
      expect(res.body.data.monthlyLimitKwh).toBe(400);
    });

    it('user cannot update building or owner', async () => {
      const res = await request(app)
        .put(`/api/v1/units/${testUnit._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ owner: adminUser._id }); // ignored for user
      
      expect(res.status).toBe(200);
      expect(res.body.data.owner._id.toString()).toBe(testUser._id.toString());
    });
  });

  describe('POST /api/v1/units/:id/regenerate-key', () => {
    it('regenerates key and returns plain version', async () => {
      const unit = await Unit.create({
        name: 'My Flat', building: testBuilding._id, owner: testUser._id, unitType: 'residential', monthlyLimitKwh: 300,
      });

      const res = await request(app)
        .post(`/api/v1/units/${unit._id}/regenerate-key`)
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.data.deviceKeyPlain).toBeDefined();
    });
  });
});
