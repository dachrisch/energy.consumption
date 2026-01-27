import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processBulkReadings } from '../readingService';

// Mock types
type MockModel = {
  findOne: any;
  find: any;
  create: any;
  insertMany: any;
};

describe('Reading Service - Bulk Import', () => {
  let mockReadingModel: MockModel;
  let mockMeterModel: MockModel;
  const userId = 'user-123';

  beforeEach(() => {
    mockReadingModel = {
      findOne: vi.fn(),
      find: vi.fn(),
      create: vi.fn(),
      insertMany: vi.fn(),
    };
    mockMeterModel = {
      findOne: vi.fn(),
      find: vi.fn(),
    };
  });

  it('processes valid readings successfully', async () => {
    const readings = [
      { meterId: 'meter-1', date: new Date('2023-01-01'), value: 100 },
      { meterId: 'meter-1', date: new Date('2023-02-01'), value: 200 },
    ];

    // Mock meter ownership check
    mockMeterModel.find.mockResolvedValue([{ _id: 'meter-1' }]);
    
    // Mock duplicate check (none found)
    mockReadingModel.find.mockResolvedValue([]);
    
    // Mock insertion
    mockReadingModel.insertMany.mockResolvedValue(readings);

    const result = await processBulkReadings(readings, userId, mockMeterModel as any, mockReadingModel as any);

    expect(result.successCount).toBe(2);
    expect(result.errors).toHaveLength(0);
    expect(mockReadingModel.insertMany).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ value: 100 }),
      expect.objectContaining({ value: 200 })
    ]));
  });

  it('filters out readings for unowned meters', async () => {
    const readings = [
      { meterId: 'meter-1', date: new Date('2023-01-01'), value: 100 },
      { meterId: 'meter-owned-by-other', date: new Date('2023-01-01'), value: 100 },
    ];

    // Only meter-1 is found for this user
    mockMeterModel.find.mockResolvedValue([{ _id: 'meter-1' }]);
    mockReadingModel.find.mockResolvedValue([]);

    const result = await processBulkReadings(readings, userId, mockMeterModel as any, mockReadingModel as any);

    expect(result.successCount).toBe(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain('Meter not found or not owned');
  });

  it('skips duplicate readings (same meter and date)', async () => {
    const readings = [
      { meterId: 'meter-1', date: new Date('2023-01-01'), value: 100 }, // Duplicate
      { meterId: 'meter-1', date: new Date('2023-02-01'), value: 200 }, // New
    ];

    mockMeterModel.find.mockResolvedValue([{ _id: 'meter-1' }]);
    
    // Mock duplicate check finds the first one, then finds nothing for the second
    mockReadingModel.find
      .mockResolvedValueOnce([
        { meterId: 'meter-1', date: new Date('2023-01-01'), value: 99 }
      ])
      .mockResolvedValueOnce([]);

    const result = await processBulkReadings(readings, userId, mockMeterModel as any, mockReadingModel as any);

    expect(result.successCount).toBe(1);
    expect(result.skippedCount).toBe(1);
    expect(mockReadingModel.insertMany).toHaveBeenCalledWith([
      expect.objectContaining({ value: 200 })
    ]);
  });
});
