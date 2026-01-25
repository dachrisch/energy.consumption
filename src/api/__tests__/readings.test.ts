import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import Reading from '../../models/Reading';
import User from '../../models/User';
import Meter from '../../models/Meter';

describe('Reading API Logic', () => {
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
    await Reading.deleteMany({});
  });

  it('updates a reading correctly', async () => {
    const reading = await Reading.create({
      meterId,
      value: 100,
      date: new Date('2026-01-01'),
      userId
    });

    const updated = await Reading.findOneAndUpdate(
      { _id: reading._id },
      { $set: { value: 150 } },
      { new: true }
    ).setOptions({ userId });

    expect(updated?.value).toBe(150);
  });

  it('deletes a reading correctly', async () => {
    const reading = await Reading.create({
      meterId,
      value: 100,
      date: new Date('2026-01-01'),
      userId
    });

    const result = await Reading.deleteOne({ _id: reading._id }).setOptions({ userId });
    expect(result.deletedCount).toBe(1);
    
    const count = await Reading.countDocuments({ _id: reading._id });
    expect(count).toBe(0);
  });
});
