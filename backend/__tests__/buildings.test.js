import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app.js';
import User from '../src/models/User.js';
import Building from '../src/models/Building.js';
import Unit from '../src/models/Unit.js';
import jwt from 'jsonwebtoken';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connectDB } from '../src/config/db.js';

const signToken = (id, role) => jwt.sign({ sub: id, role }, process.env.JWT_SECRET, { expiresIn: '1h' });

describe('Buildings API', () => {
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
    await Building.deleteMany({});
    await User.deleteMany({});
    await Unit.deleteMany({});
    
    adminUser = await User.create({
      name: 'Admin',
      email: 'admin@b.com',
      passwordHash: 'hashed',
      role: 'admin',
    });
    adminToken = signToken(adminUser._id, adminUser.role);

    testUser = await User.create({
      name: 'User',
      email: 'user@b.com',
      passwordHash: 'hashed',
      role: 'user',
    });
    userToken = signToken(testUser._id, testUser.role);

    testBuilding = await Building.create({
      name: 'Alpha Tower',
      address: '123 Main St',
      createdBy: adminUser._id,
    });
  });

  describe('POST /api/v1/buildings', () => {
    it('creates building with valid data (admin)', async () => {
      const res = await request(app)
        .post('/api/v1/buildings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Beta Tower', address: '456 Second St' });
      
      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Beta Tower');
    });

    it('returns 400 for missing required fields', async () => {
      const res = await request(app)
        .post('/api/v1/buildings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Incomplete Building' }); // missing address
      
      expect(res.status).toBe(400);
    });

    it('returns 403 for user role', async () => {
      const res = await request(app)
        .post('/api/v1/buildings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Beta Tower', address: '456 Second St' });
      
      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/v1/buildings/:id', () => {
    it('deletes a building with no units', async () => {
      const res = await request(app)
        .delete(`/api/v1/buildings/${testBuilding._id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.status).toBe(200);
      const b = await Building.findById(testBuilding._id);
      expect(b).toBeNull();
    });

    it('returns 409 when deleting a building with active units', async () => {
      await Unit.create({
        name: 'Flat 1',
        building: testBuilding._id,
        owner: testUser._id,
        unitType: 'residential',
        monthlyLimitKwh: 300,
      });

      const res = await request(app)
        .delete(`/api/v1/buildings/${testBuilding._id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.status).toBe(409);
    });
  });
});
