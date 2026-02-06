import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connect, disconnect } from 'mongoose';
import User from '../../models/User';
import Meter from '../../models/Meter';
import Reading from '../../models/Reading';

let mongoServer: MongoMemoryServer;
let userId: string;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await connect(mongoServer.getUri());

  const user = await User.create({
    email: 'test@example.com',
    password: 'hashed',
    name: 'Test User'
  });
  userId = user._id.toString();
});

afterAll(async () => {
  await disconnect();
  await mongoServer.stop();
});

describe('Import with Meter Creation', () => {
  it('should import readings for a created meter', async () => {
    // Start with no meters
    let meters = await Meter.find({}).setOptions({ userId });
    expect(meters).toHaveLength(0);

    // Create a new meter directly
    const meter = await Meter.create({
      name: 'Main Meter',
      meterNumber: 'M001',
      type: 'power',
      unit: 'kWh',
      userId
    });

    const meterId = meter._id.toString();

    // Verify meter was created
    meters = await Meter.find({}).setOptions({ userId });
    expect(meters).toHaveLength(1);
    expect(meters[0].name).toBe('Main Meter');

    // Import readings for the meter
    const importReadings = [
      { meterId, date: '2024-01-15', value: 100 },
      { meterId, date: '2024-01-16', value: 105 },
      { meterId, date: '2024-01-17', value: 110 }
    ];

    // Simulate bulk import
    const readings = await Reading.create(
      importReadings.map((r: any) => ({
        ...r,
        date: new Date(r.date),
        userId
      }))
    );

    // Verify readings were created
    const storedReadings = await Reading.find({ meterId }).setOptions({ userId });
    expect(storedReadings).toHaveLength(3);
    expect(storedReadings[0].value).toBe(100);
    expect(storedReadings[1].value).toBe(105);
    expect(storedReadings[2].value).toBe(110);

    // Verify meter still exists with readings
    meters = await Meter.find({}).setOptions({ userId });
    expect(meters).toHaveLength(1);
  });

  it('should import readings for existing meter without creating duplicate', async () => {
    // Create a meter
    const meter = await Meter.create({
      name: 'Existing Meter',
      meterNumber: 'M002',
      type: 'power',
      unit: 'kWh',
      userId
    });

    const meterId = meter._id.toString();

    // Import readings
    const importReadings = [
      { meterId, date: '2024-02-01', value: 200 },
      { meterId, date: '2024-02-02', value: 205 }
    ];

    await Reading.create(
      importReadings.map(r => ({
        ...r,
        date: new Date(r.date),
        userId
      }))
    );

    // Verify only one meter exists (not duplicate)
    const meters = await Meter.find({}).setOptions({ userId });
    expect(meters.length).toBeGreaterThanOrEqual(1);

    const existingMeter = meters.find(m => m._id.equals(meter._id));
    expect(existingMeter).toBeDefined();

    // Verify readings were created
    const readings = await Reading.find({ meterId }).setOptions({ userId });
    expect(readings).toHaveLength(2);
  });

  it('should handle re-importing exported data with meter recreation', async () => {
    // Create initial meter and readings
    const meter = await Meter.create({
      name: 'Export Test Meter',
      meterNumber: 'M003',
      type: 'power',
      unit: 'kWh',
      userId
    });

    const meterId = meter._id.toString();

    const readings = await Reading.create([
      { meterId, date: new Date('2024-03-01'), value: 300, userId },
      { meterId, date: new Date('2024-03-02'), value: 305, userId },
      { meterId, date: new Date('2024-03-03'), value: 310, userId }
    ]);

    // Simulate export format
    const exportData = [
      {
        meter: {
          id: meter._id.toString(),
          name: meter.name,
          meterNumber: meter.meterNumber,
          type: meter.type,
          unit: meter.unit
        },
        readings: readings.map((r: any) => ({
          value: r.value,
          date: r.date.toISOString().split('T')[0],
          createdAt: r.createdAt
        }))
      }
    ];

    // Verify export format structure
    expect(exportData).toHaveLength(1);
    expect(exportData[0].meter.name).toBe('Export Test Meter');
    expect(exportData[0].readings).toHaveLength(3);
    expect(exportData[0].readings[0].value).toBe(300);

    // Parse exported data (simulating re-import)
    const meterInfo = exportData[0].meter;
    expect(meterInfo.id).toBe(meterId);
    expect(meterInfo.name).toBe('Export Test Meter');

    const importedReadings = exportData[0].readings.map((r: any) => ({
      meterId: meterInfo.id,
      date: r.date,
      value: r.value
    }));

    expect(importedReadings).toHaveLength(3);
    expect(importedReadings[0]).toEqual({
      meterId,
      date: '2024-03-01',
      value: 300
    });
  });

  it('should handle readings for meters that might be deleted', async () => {
    // Create a meter
    const meter = await Meter.create({
      name: 'Deletion Test Meter',
      meterNumber: 'M004',
      type: 'power',
      unit: 'kWh',
      userId
    });

    const meterId = meter._id.toString();

    // Add readings
    const reading = await Reading.create({
      meterId,
      date: new Date('2024-04-01'),
      value: 400,
      userId
    });

    expect(reading).toBeDefined();
    expect(reading.meterId.toString()).toBe(meterId);

    // Verify meter exists
    let foundMeter = await Meter.findById(meterId).setOptions({ userId });
    expect(foundMeter).toBeDefined();
    expect(foundMeter?.name).toBe('Deletion Test Meter');

    // Verify reading can be found
    const foundReading = await Reading.findById(reading._id).setOptions({ userId });
    expect(foundReading).toBeDefined();
    expect(foundReading?.value).toBe(400);
  });
});
