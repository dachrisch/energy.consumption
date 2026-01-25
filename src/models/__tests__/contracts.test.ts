import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import Contract from '../Contract';
import Meter from '../Meter';
import User from '../User';

describe('Contract Model Validation', () => {
  let mongoServer: MongoMemoryServer;
  let userId: string;
  let meterId: string;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    
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

  it('detects overlapping contract periods', async () => {
    // Jan 1 to June 30
    await Contract.create({
      providerName: 'Provider A',
      type: 'power',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-06-30'),
      basePrice: 10,
      workingPrice: 0.3,
      meterId,
      userId
    });

    // Case 1: Overlap at the end (March to Dec)
    const start1 = new Date('2026-03-01');
    const end1 = new Date('2026-12-31');
    const overlap1 = await Contract.findOne({
      meterId,
      startDate: { $lte: end1 },
      $or: [
        { endDate: { $gte: start1 } },
        { endDate: null }
      ]
    });
    expect(overlap1).not.toBeNull();

    // Case 2: No overlap (July to Dec)
    const start2 = new Date('2026-07-01');
    const end2 = new Date('2026-12-31');
    const overlap2 = await Contract.findOne({
      meterId,
      startDate: { $lte: end2 },
      $or: [
        { endDate: { $gte: start2 } },
        { endDate: null }
      ]
    });
    expect(overlap2).toBeNull();
  });
});
