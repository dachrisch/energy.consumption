import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import Meter from '../Meter';

describe('User Isolation Middleware', () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await Meter.deleteMany({});
  });

  it('filters find queries by userId when provided in options', async () => {
    const userA = new mongoose.Types.ObjectId();
    const userB = new mongoose.Types.ObjectId();

    await Meter.create([
      { name: 'Meter A', meterNumber: 'A1', type: 'power', unit: 'kWh', userId: userA },
      { name: 'Meter B', meterNumber: 'B1', type: 'power', unit: 'kWh', userId: userB },
    ]);

    // Query for user A
    const metersForA = await Meter.find({}).setOptions({ userId: userA });
    expect(metersForA).toHaveLength(1);
    expect(metersForA[0].name).toBe('Meter A');

    // Query for user B
    const metersForB = await Meter.find({}).setOptions({ userId: userB });
    expect(metersForB).toHaveLength(1);
    expect(metersForB[0].name).toBe('Meter B');
  });

  it('does not filter if userId is not provided in options (for internal use)', async () => {
    const userA = new mongoose.Types.ObjectId();
    const userB = new mongoose.Types.ObjectId();

    await Meter.create([
      { name: 'Meter A', meterNumber: 'A1', type: 'power', unit: 'kWh', userId: userA },
      { name: 'Meter B', meterNumber: 'B1', type: 'power', unit: 'kWh', userId: userB },
    ]);

    const allMeters = await Meter.find({});
    expect(allMeters).toHaveLength(2);
  });
});
