import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import Reading from '../../models/Reading';
import User from '../../models/User';
import Meter from '../../models/Meter';
import Contract from '../../models/Contract';
import type { ApiRequest, ApiResponse, RouteParams } from '../utils';
import {
  exportUnifiedFormat,
  handleReadingItem,
  handleUnifiedImport,
} from './reading.controller';

function mockResponse() {
  let body = '';
  const res: ApiResponse = {
    statusCode: 200,
    setHeader: () => undefined,
    end: (data: string) => { body = data; },
  };
  return { res, body: () => body };
}

function routeParams(
  userId: string,
  path: string,
  method: string,
  body: Record<string, unknown> = {},
): RouteParams {
  const req: ApiRequest = { url: path, method, headers: {}, body };
  const { res } = mockResponse();
  return { req, res, userId, path, url: new URL(path, 'http://localhost') };
}

describe('Reading updates and kind backup round-trip', () => {
  let mongoServer: MongoMemoryServer;
  let userId: string;
  let otherUserId: string;
  let meterId: string;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    const [user, otherUser] = await User.create([
      { name: 'Owner', email: 'owner@test.com', password: '123' },
      { name: 'Other', email: 'other@test.com', password: '123' },
    ]);
    userId = user._id.toString();
    otherUserId = otherUser._id.toString();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await Reading.deleteMany({});
    await Meter.deleteMany({});
    await Contract.deleteMany({});
    const meter = await Meter.create({
      name: 'Power', meterNumber: 'P1', type: 'power', unit: 'kWh', userId,
    });
    meterId = meter._id.toString();
  });

  it('updates value, date, and kind and recalculates meter stats', async () => {
    const [, updatedReading] = await Reading.create([
      { meterId, value: 100, date: new Date('2026-01-01'), userId },
      { meterId, value: 200, date: new Date('2026-01-11'), userId },
    ]);

    const params = routeParams(userId, `/api/readings/${updatedReading._id}`, 'PUT', {
      value: 300,
      date: '2026-01-11',
      kind: 'meterChange',
    });
    await handleReadingItem(params);

    expect(params.res.statusCode).toBe(200);
    const stored = await Reading.findById(updatedReading._id);
    expect(stored.value).toBe(300);
    expect(stored.kind).toBe('meterChange');
    const meter = await Meter.findById(meterId);
    expect(meter.stats.dailyAverage).toBe(0);
  });

  it('does not update another user’s reading', async () => {
    const otherMeter = await Meter.create({
      name: 'Other meter', meterNumber: 'P2', type: 'power', unit: 'kWh', userId: otherUserId,
    });
    const otherReading = await Reading.create({
      meterId: otherMeter._id,
      value: 500,
      date: new Date('2026-01-01'),
      userId: otherUserId,
    });

    const params = routeParams(userId, `/api/readings/${otherReading._id}`, 'PUT', {
      value: 999,
      date: '2026-01-02',
      kind: 'meterChange',
    });
    await handleReadingItem(params);

    expect(params.res.statusCode).toBe(404);
    const unchanged = await Reading.findById(otherReading._id);
    expect(unchanged.value).toBe(500);
    expect(unchanged.kind).toBe('regular');
    expect(unchanged.date.toISOString().slice(0, 10)).toBe('2026-01-01');
  });

  it('round-trips kind through unified export and import', async () => {
    await Reading.create({
      meterId,
      value: 0,
      date: new Date('2025-09-17'),
      kind: 'meterChange',
      userId,
    });
    const backup = await exportUnifiedFormat(userId, {
      includeMeters: true,
      includeReadings: true,
      includeContracts: true,
    });
    expect(backup.data.readings[0].kind).toBe('meterChange');

    await Reading.deleteMany({});
    const params = routeParams(userId, '/api/import/unified', 'POST', backup);
    await handleUnifiedImport(params);

    expect(params.res.statusCode).toBe(200);
    const restored = await Reading.findOne({}).setOptions({ userId });
    expect(restored.kind).toBe('meterChange');
  });

  it('accepts an old unified backup without kind as a regular reading', async () => {
    await Reading.create({ meterId, value: 100, date: new Date('2026-01-01'), userId });
    const backup = await exportUnifiedFormat(userId, {
      includeMeters: true,
      includeReadings: true,
      includeContracts: true,
    });
    Reflect.deleteProperty(backup.data.readings[0], 'kind');

    await Reading.deleteMany({});
    const params = routeParams(userId, '/api/import/unified', 'POST', backup);
    await handleUnifiedImport(params);

    expect(params.res.statusCode).toBe(200);
    const restored = await Reading.findOne({}).setOptions({ userId });
    expect(restored.kind).toBe('regular');
  });
});
