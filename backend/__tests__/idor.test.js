import request from 'supertest';
import app from '../app.js';
import User from '../src/models/User.js';
import Building from '../src/models/Building.js';
import Unit from '../src/models/Unit.js';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connectDB } from '../src/config/db.js';

const signToken = (id, role) => jwt.sign({ sub: id, role }, process.env.JWT_SECRET, { expiresIn: '1h' });

describe('IDOR Prevention', () => {
  let userA, userB, adminUser, tokenA, tokenB, adminToken, unitB, building, mongoServer;

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

    adminUser = await User.create({ name: 'Admin', email: 'admin@idor.com', passwordHash: 'pwd', role: 'admin' });
    adminToken = signToken(adminUser._id, adminUser.role);

    userA = await User.create({ name: 'Alice', email: 'a@idor.com', passwordHash: 'pwd', role: 'user' });
    tokenA = signToken(userA._id, userA.role);

    userB = await User.create({ name: 'Bob', email: 'b@idor.com', passwordHash: 'pwd', role: 'user' });
    tokenB = signToken(userB._id, userB.role);

    building = await Building.create({ name: 'Bldg', address: '123 Main St', createdBy: adminUser._id });

    unitB = await Unit.create({
      name: "B's Unit",
      building: building._id,
      owner: userB._id,
      unitType: 'residential',
      monthlyLimitKwh: 300,
    });
  });

  it('User A calls GET /units/:idOfUserBUnit -> 404 (not 403, avoids leaking existence)', async () => {
    const res = await request(app)
      .get(`/api/v1/units/${unitB._id}`)
      .set('Authorization', `Bearer ${tokenA}`);
    
    expect(res.status).toBe(404); // IDOR prevented
  });

  it('User A calls PUT /units/:idOfUserBUnit -> 404', async () => {
    const res = await request(app)
      .put(`/api/v1/units/${unitB._id}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'Hacked Name' });
    
    expect(res.status).toBe(404);
  });

  it('Admin calls GET /units/:anyUnitId -> 200', async () => {
    const res = await request(app)
      .get(`/api/v1/units/${unitB._id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe("B's Unit");
  });
});
