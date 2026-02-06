import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import Reading from '../../models/Reading';
import User from '../../models/User';
import Meter from '../../models/Meter';
import { exportReadingsAsJson } from './reading.controller';

describe('Reading Controller - Export', () => {
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

  it('exports readings as JSON with nested format', async () => {
    // Create readings for the meter
    await Reading.create({
      meterId,
      value: 100,
      date: new Date('2026-01-01'),
      userId
    });

    await Reading.create({
      meterId,
      value: 150,
      date: new Date('2026-01-02'),
      userId
    });

    const data = await exportReadingsAsJson(userId);

    expect(data).toHaveLength(1);
    expect(data[0].meter.id).toBe(meterId);
    expect(data[0].meter.name).toBe('Power');
    expect(data[0].meter.meterNumber).toBe('P1');
    expect(data[0].meter.type).toBe('power');
    expect(data[0].meter.unit).toBe('kWh');
    
    expect(data[0].readings).toHaveLength(2);
    expect(data[0].readings[0].value).toBe(100);
    expect(data[0].readings[0].date).toBe('2026-01-01');
    expect(data[0].readings[1].value).toBe(150);
    expect(data[0].readings[1].date).toBe('2026-01-02');
  });

  it('exports empty readings when no data exists', async () => {
    const data = await exportReadingsAsJson(userId);

    expect(data).toHaveLength(1);
    expect(data[0].readings).toHaveLength(0);
  });

  it('handles multiple meters correctly', async () => {
    const meter2 = await Meter.create({ name: 'Gas', meterNumber: 'G1', type: 'gas', unit: 'm³', userId });
    const meterId2 = meter2._id.toString();

    await Reading.create({
      meterId,
      value: 100,
      date: new Date('2026-01-01'),
      userId
    });

    await Reading.create({
      meterId: meterId2,
      value: 50,
      date: new Date('2026-01-01'),
      userId
    });

    const data = await exportReadingsAsJson(userId);

    expect(data).toHaveLength(2);
    expect(data[0].meter.id).toBe(meterId);
    expect(data[0].readings).toHaveLength(1);
    expect(data[1].meter.id).toBe(meterId2);
    expect(data[1].readings).toHaveLength(1);
  });

  it('sorts readings by date', async () => {
    await Reading.create({
      meterId,
      value: 100,
      date: new Date('2026-01-03'),
      userId
    });

    await Reading.create({
      meterId,
      value: 150,
      date: new Date('2026-01-01'),
      userId
    });

    await Reading.create({
      meterId,
      value: 125,
      date: new Date('2026-01-02'),
      userId
    });

    const data = await exportReadingsAsJson(userId);

    expect(data[0].readings[0].date).toBe('2026-01-01');
    expect(data[0].readings[1].date).toBe('2026-01-02');
    expect(data[0].readings[2].date).toBe('2026-01-03');
  });
});
