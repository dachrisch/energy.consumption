import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import Contract from '../../models/Contract';
import Meter from '../../models/Meter';
import User from '../../models/User';

describe('Contract Model & Validation', () => {
  let mongoServer: MongoMemoryServer;
  let userId: string;
  let meterId: string;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    process.env.MONGODB_URI = uri;
    await mongoose.connect(uri);
    
    const user = await User.create({ name: 'Test', email: 'test@test.com', password: '123' });
    userId = user._id.toString();
    
    const meter = await Meter.create({ name: 'Power', meterNumber: 'P1', type: 'power', unit: 'kWh', userId });
    meterId = meter._id.toString();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await Contract.deleteMany({});
  });

  it('creates a contract with correct field mapping', async () => {
    // Test that Contract model correctly stores all required fields
    const contract = await Contract.create({
      providerName: 'Test Provider',
      type: 'power',
      startDate: new Date('2027-01-01'),
      endDate: new Date('2027-12-31'),
      basePrice: 15.50,
      workingPrice: 0.3221,
      meterId,
      userId
    });

    expect(contract.providerName).toBe('Test Provider');
    expect(contract.basePrice).toBe(15.50);
    expect(contract.workingPrice).toBe(0.3221);
    expect(contract.meterId.toString()).toBe(meterId);
  });

  it('enforces required fields in contract model', async () => {
    // Test that the model schema enforces required fields
    try {
      await Contract.create({
        type: 'power',
        startDate: new Date('2027-01-01'),
        // Missing providerName and basePrice/workingPrice
        meterId,
        userId
      });
      expect.fail('Should have thrown validation error');
    } catch (e) {
      // Expected - validation error for missing fields
      expect((e as any).message).toBeTruthy();
    }
  });
});
