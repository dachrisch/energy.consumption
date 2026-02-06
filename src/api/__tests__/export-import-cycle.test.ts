import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connect, disconnect } from 'mongoose';
import User from '../../models/User';
import Meter from '../../models/Meter';
import Reading from '../../models/Reading';
import { exportReadingsAsJson, exportFullBackup } from '../controllers/reading.controller';
import { validateJsonStructure, parseNestedFormat } from '../../lib/jsonParser';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await connect(mongoServer.getUri());
});

afterAll(async () => {
  await disconnect();
  await mongoServer.stop();
});

describe('Export/Import Cycle', () => {
  it('should export empty meters as valid empty array', async () => {
    const user = await User.create({
      email: 'test1@example.com',
      password: 'hashed',
      name: 'Test User 1'
    });
    const userId = user._id.toString();

    const exportData = await exportReadingsAsJson(userId);
    
    // Should return empty array
    expect(exportData).toEqual([]);
    
    // Validation should handle empty array
    const format = validateJsonStructure(exportData);
    expect(format).toBe('nested');
    
    // Parsing should handle empty array
    const parsed = parseNestedFormat(exportData);
    expect(parsed.meters).toHaveLength(0);
    expect(parsed.readings).toHaveLength(0);
  });

  it('should export and re-import single meter with readings', async () => {
    const user = await User.create({
      email: 'test2@example.com',
      password: 'hashed',
      name: 'Test User 2'
    });
    const userId = user._id.toString();

    // Create meter
    const meter = await Meter.create({
      name: 'Test Meter',
      meterNumber: 'TM001',
      type: 'power',
      unit: 'kWh',
      userId
    });
    const meterId = meter._id.toString();

    // Add readings
    await Reading.create([
      { meterId, date: new Date('2024-01-01'), value: 100, userId },
      { meterId, date: new Date('2024-01-02'), value: 105, userId },
      { meterId, date: new Date('2024-01-03'), value: 110, userId }
    ]);

    // Export the data
    const exportedData = await exportReadingsAsJson(userId);
    
    expect(exportedData).toHaveLength(1);
    expect(exportedData[0].meter.id).toBe(meterId);
    expect(exportedData[0].meter.name).toBe('Test Meter');
    expect(exportedData[0].readings).toHaveLength(3);
    
    // Verify export format is correct
    const format = validateJsonStructure(exportedData);
    expect(format).toBe('nested');
    
    // Parse the exported data (simulating re-import)
    const parsed = parseNestedFormat(exportedData);
    
    expect(parsed.meters).toHaveLength(1);
    expect(parsed.meters[0].name).toBe('Test Meter');
    expect(parsed.readings).toHaveLength(3);
    expect(parsed.readings[0].date).toBe('2024-01-01');
    expect(parsed.readings[0].value).toBe(100);
    expect(parsed.readings[1].value).toBe(105);
    expect(parsed.readings[2].value).toBe(110);
  });

  it('should export multiple meters correctly', async () => {
    const user = await User.create({
      email: 'test3@example.com',
      password: 'hashed',
      name: 'Test User 3'
    });
    const userId = user._id.toString();

    // Create two meters
    const meter1 = await Meter.create({
      name: 'Kitchen Meter',
      meterNumber: 'KM001',
      type: 'power',
      unit: 'kWh',
      userId
    });

    const meter2 = await Meter.create({
      name: 'Gas Meter',
      meterNumber: 'GM001',
      type: 'gas',
      unit: 'm³',
      userId
    });

    // Add readings for both
    await Reading.create([
      { meterId: meter1._id.toString(), date: new Date('2024-02-01'), value: 200, userId },
      { meterId: meter2._id.toString(), date: new Date('2024-02-01'), value: 50, userId }
    ]);

    // Export
    const exportedData = await exportReadingsAsJson(userId);
    
    expect(exportedData).toHaveLength(2);
    
    // Parse and verify
    const parsed = parseNestedFormat(exportedData);
    expect(parsed.meters).toHaveLength(2);
    expect(parsed.readings).toHaveLength(2);
    
    const meter1Readings = parsed.readings.filter(r => r.meterId === meter1._id.toString());
    const meter2Readings = parsed.readings.filter(r => r.meterId === meter2._id.toString());
    
    expect(meter1Readings).toHaveLength(1);
    expect(meter2Readings).toHaveLength(1);
    expect(meter1Readings[0].value).toBe(200);
    expect(meter2Readings[0].value).toBe(50);
  });

  it('should export single meter when meterId specified', async () => {
    const user = await User.create({
      email: 'test4@example.com',
      password: 'hashed',
      name: 'Test User 4'
    });
    const userId = user._id.toString();

    // Create two meters
    const meter1 = await Meter.create({
      name: 'Meter 1',
      meterNumber: 'M1',
      type: 'power',
      unit: 'kWh',
      userId
    });

    const meter2 = await Meter.create({
      name: 'Meter 2',
      meterNumber: 'M2',
      type: 'power',
      unit: 'kWh',
      userId
    });

    // Add readings for both
    await Reading.create([
      { meterId: meter1._id.toString(), date: new Date('2024-03-01'), value: 300, userId },
      { meterId: meter2._id.toString(), date: new Date('2024-03-01'), value: 400, userId }
    ]);

    // Export only meter1
    const exportedData = await exportReadingsAsJson(userId, meter1._id.toString());
    
    // Should only contain meter1
    expect(exportedData).toHaveLength(1);
    expect(exportedData[0].meter.id).toBe(meter1._id.toString());
    expect(exportedData[0].readings).toHaveLength(1);
    expect(exportedData[0].readings[0].value).toBe(300);
  });

  it('should handle full backup export', async () => {
    const user = await User.create({
      email: 'test5@example.com',
      password: 'hashed',
      name: 'Test User 5'
    });
    const userId = user._id.toString();

    // Create a backup including contracts
    const backup = await exportFullBackup(userId);
    
    expect(backup.exportDate).toBeDefined();
    expect(backup.version).toBe('1.0');
    expect(backup.data).toBeDefined();
    expect(backup.data.meters).toBeDefined();
    expect(backup.data.readings).toBeDefined();
    expect(backup.data.contracts).toBeDefined();
  });

  it('should round-trip through JSON stringify/parse', async () => {
    const user = await User.create({
      email: 'test6@example.com',
      password: 'hashed',
      name: 'Test User 6'
    });
    const userId = user._id.toString();

    // Create meter with readings
    const meter = await Meter.create({
      name: 'Round-trip Meter',
      meterNumber: 'RT001',
      type: 'power',
      unit: 'kWh',
      userId
    });

    await Reading.create([
      { meterId: meter._id.toString(), date: new Date('2024-04-01'), value: 500.5, userId },
      { meterId: meter._id.toString(), date: new Date('2024-04-02'), value: 505.25, userId }
    ]);

    // Export
    const originalData = await exportReadingsAsJson(userId, meter._id.toString());
    
    // Stringify and parse (simulating file upload)
    const jsonString = JSON.stringify(originalData);
    const reparsedData = JSON.parse(jsonString);
    
    // Should validate and parse correctly
    const format = validateJsonStructure(reparsedData);
    expect(format).toBe('nested');
    
    const parsed = parseNestedFormat(reparsedData);
    expect(parsed.meters).toHaveLength(1);
    expect(parsed.readings).toHaveLength(2);
    expect(parsed.readings[0].value).toBe(500.5);
    expect(parsed.readings[1].value).toBe(505.25);
  });
});
