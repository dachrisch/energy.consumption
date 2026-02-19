import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Reading from '../../models/Reading';
import User from '../../models/User';
import Meter from '../../models/Meter';
import Contract from '../../models/Contract';
import { recalculateUserStats } from '../../lib/recalculationService';

describe('Recalculation Service', () => {
  let mongoServer: MongoMemoryServer;
  let userId: string;
  let meterId: string;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    
    const user = await User.create({ name: 'Test', email: 'test@test.com', password: '123' });
    userId = user._id.toString();
    
    const meter = await Meter.create({ 
        name: 'test', 
        meterNumber: 't', 
        type: 'power', 
        unit: 'kWh', 
        userId 
    });
    meterId = meter._id.toString();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  it('recalculates and stores stats correctly', async () => {
    // Add readings
    await Reading.create([
        { value: 100, date: new Date("2025-01-01"), meterId, userId },
        { value: 200, date: new Date("2025-01-11"), meterId, userId } // 100 kWh over 10 days = 10 kWh/day
    ]);

    // Add contract
    await Contract.create({
        providerName: 'test',
        startDate: new Date("2025-01-01"),
        basePrice: 10, // 10 per month
        workingPrice: 0.20, // 0.20 per kWh
        meterId,
        userId
    });

    await recalculateUserStats(userId);

    const updatedMeter = await Meter.findById(meterId);
    expect(updatedMeter.stats.dailyAverage).toBeCloseTo(10);
    expect(updatedMeter.stats.dailyCost).toBeGreaterThan(2); // 10 * 0.20 + 10/30.44 = 2.32

    const updatedUser = await User.findById(userId);
    expect(updatedUser.stats).toBeDefined();
    expect(updatedUser.stats.totalYearlyCost).toBeGreaterThan(0);
  });
});
