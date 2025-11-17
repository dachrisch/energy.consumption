/**
 * Tests for DisplayDataCalculationService
 *
 * Test-first approach: Write tests before implementation
 * Coverage target: >95%
 *
 * Test scenarios:
 * - Monthly chart data calculation
 * - Histogram data calculation
 * - Invalidation operations
 * - Hash generation
 * - Metadata tracking
 * - Integration with existing aggregation services
 */

import { DisplayDataCalculationService } from '../display/DisplayDataCalculationService';
import { IEnergyRepository } from '@/repositories/interfaces/IEnergyRepository';
import { IDisplayDataRepository } from '@/repositories/interfaces/IDisplayDataRepository';
import { SourceEnergyReading, DisplayEnergyData, MonthlyDataPoint } from '@/app/types';
import { HistogramBucket } from '@/app/services/DataAggregationService';

// Mock the aggregation services BEFORE imports
jest.mock('@/app/services/MonthlyDataAggregationService', () => ({
  calculateMonthlyReadings: jest.fn(),
}));

jest.mock('@/app/services/DataAggregationService', () => ({
  aggregateDataIntoBuckets: jest.fn(),
}));

// Import AFTER mocking
import { calculateMonthlyReadings } from '@/app/services/MonthlyDataAggregationService';
import { aggregateDataIntoBuckets } from '@/app/services/DataAggregationService';

// Mock repositories
class MockEnergyRepository implements IEnergyRepository {
  create = jest.fn();
  createMany = jest.fn();
  findById = jest.fn();
  findAll = jest.fn();
  findByDateRange = jest.fn();
  update = jest.fn();
  delete = jest.fn();
  deleteMany = jest.fn();
  count = jest.fn();
  getMinMaxDates = jest.fn();
}

class MockDisplayDataRepository implements IDisplayDataRepository {
  upsert = jest.fn();
  findByType = jest.fn();
  findByTypeAndFilters = jest.fn();
  deleteByType = jest.fn();
  deleteAllForUser = jest.fn();
  invalidateForUser = jest.fn();
}

describe('DisplayDataCalculationService', () => {
  let service: DisplayDataCalculationService;
  let mockEnergyRepo: MockEnergyRepository;
  let mockDisplayRepo: MockDisplayDataRepository;

  const userId = 'user-123';
  const year = 2024;

  const createReading = (overrides?: Partial<SourceEnergyReading>): SourceEnergyReading => ({
    _id: 'reading-1',
    userId,
    type: 'power',
    amount: 1000,
    date: new Date('2024-01-15T10:00:00Z'),
    createdAt: new Date('2024-01-15T10:00:00Z'),
    updatedAt: new Date('2024-01-15T10:00:00Z'),
    ...overrides,
  });

  beforeEach(() => {
    mockEnergyRepo = new MockEnergyRepository();
    mockDisplayRepo = new MockDisplayDataRepository();
    service = new DisplayDataCalculationService(mockEnergyRepo, mockDisplayRepo);

    jest.clearAllMocks();
  });

  describe('calculateMonthlyChartData()', () => {
    const mockMonthlyData: MonthlyDataPoint[] = [
      {
        month: 1,
        monthLabel: 'Jan',
        meterReading: 1000,
        isActual: true,
        isInterpolated: false,
        isExtrapolated: false,
      },
      {
        month: 2,
        monthLabel: 'Feb',
        meterReading: 1100,
        isActual: true,
        isInterpolated: false,
        isExtrapolated: false,
      },
    ] as MonthlyDataPoint[];

    beforeEach(() => {
      // Mock calculateMonthlyReadings function
      (calculateMonthlyReadings as jest.Mock).mockReturnValue(mockMonthlyData);
    });

    it('should fetch readings for the specified year and type', async () => {
      const readings = [createReading()];
      mockEnergyRepo.findByDateRange.mockResolvedValue(readings);
      mockDisplayRepo.upsert.mockResolvedValue({
        _id: 'display-1',
        userId,
        displayType: 'monthly-chart-power',
        data: mockMonthlyData,
        calculatedAt: new Date(),
        sourceDataHash: 'hash123',
      });

      await service.calculateMonthlyChartData(userId, year, 'power');

      expect(mockEnergyRepo.findByDateRange).toHaveBeenCalledWith(
        userId,
        new Date(2024, 0, 1), // Jan 1, 2024
        new Date(2024, 11, 31, 23, 59, 59), // Dec 31, 2024 23:59:59
        'power'
      );
    });

    it('should use MonthlyDataAggregationService to calculate monthly data', async () => {
      const readings = [
        createReading({ _id: 'r1', date: new Date('2024-01-15') }),
        createReading({ _id: 'r2', date: new Date('2024-02-20') }),
      ];
      mockEnergyRepo.findByDateRange.mockResolvedValue(readings);
      mockDisplayRepo.upsert.mockResolvedValue({
        _id: 'display-1',
        userId,
        displayType: 'monthly-chart-power',
        data: mockMonthlyData,
        calculatedAt: new Date(),
        sourceDataHash: 'hash123',
      });

      await service.calculateMonthlyChartData(userId, year, 'power');

      expect(calculateMonthlyReadings).toHaveBeenCalledWith(readings, year, 'power');
    });

    it('should generate hash from source readings', async () => {
      const readings = [
        createReading({ _id: 'r1', date: new Date('2024-01-15T10:00:00Z') }),
        createReading({ _id: 'r2', date: new Date('2024-02-20T15:30:00Z') }),
      ];
      mockEnergyRepo.findByDateRange.mockResolvedValue(readings);
      mockDisplayRepo.upsert.mockResolvedValue({
        _id: 'display-1',
        userId,
        displayType: 'monthly-chart-power',
        data: mockMonthlyData,
        calculatedAt: new Date(),
        sourceDataHash: 'hash123',
      });

      await service.calculateMonthlyChartData(userId, year, 'power');

      // Verify upsert was called with sourceDataHash
      expect(mockDisplayRepo.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          sourceDataHash: expect.any(String),
        })
      );

      // Hash should be deterministic
      const call1 = mockDisplayRepo.upsert.mock.calls[0][0];
      expect(call1.sourceDataHash.length).toBe(64); // SHA256 hex length
    });

    it('should upsert display data with correct structure', async () => {
      const readings = [createReading()];
      mockEnergyRepo.findByDateRange.mockResolvedValue(readings);
      mockDisplayRepo.upsert.mockResolvedValue({
        _id: 'display-1',
        userId,
        displayType: 'monthly-chart-power',
        data: mockMonthlyData,
        calculatedAt: new Date(),
        sourceDataHash: 'hash123',
      });

      const result = await service.calculateMonthlyChartData(userId, year, 'power');

      expect(mockDisplayRepo.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          displayType: 'monthly-chart-power',
          data: mockMonthlyData,
          calculatedAt: expect.any(Date),
          sourceDataHash: expect.any(String),
          metadata: expect.objectContaining({
            sourceReadingCount: 1,
            calculationTimeMs: expect.any(Number),
            filters: { year, type: 'power' },
          }),
        })
      );

      expect(result).toEqual(
        expect.objectContaining({
          userId,
          displayType: 'monthly-chart-power',
        })
      );
    });

    it('should calculate metadata correctly', async () => {
      const readings = [
        createReading({ _id: 'r1' }),
        createReading({ _id: 'r2' }),
        createReading({ _id: 'r3' }),
      ];
      mockEnergyRepo.findByDateRange.mockResolvedValue(readings);
      mockDisplayRepo.upsert.mockResolvedValue({
        _id: 'display-1',
        userId,
        displayType: 'monthly-chart-power',
        data: mockMonthlyData,
        calculatedAt: new Date(),
        sourceDataHash: 'hash123',
      });

      await service.calculateMonthlyChartData(userId, year, 'power');

      const upsertCall = mockDisplayRepo.upsert.mock.calls[0][0];
      expect(upsertCall.metadata).toEqual({
        sourceReadingCount: 3,
        calculationTimeMs: expect.any(Number),
        filters: { year, type: 'power' },
      });
      expect(upsertCall.metadata?.calculationTimeMs).toBeGreaterThanOrEqual(0);
    });

    it('should handle gas type correctly', async () => {
      const readings = [createReading({ type: 'gas' })];
      mockEnergyRepo.findByDateRange.mockResolvedValue(readings);
      mockDisplayRepo.upsert.mockResolvedValue({
        _id: 'display-2',
        userId,
        displayType: 'monthly-chart-gas',
        data: mockMonthlyData,
        calculatedAt: new Date(),
        sourceDataHash: 'hash456',
      });

      await service.calculateMonthlyChartData(userId, year, 'gas');

      expect(mockEnergyRepo.findByDateRange).toHaveBeenCalledWith(
        userId,
        expect.any(Date),
        expect.any(Date),
        'gas'
      );
      expect(mockDisplayRepo.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          displayType: 'monthly-chart-gas',
        })
      );
    });

    it('should handle empty readings array', async () => {
      mockEnergyRepo.findByDateRange.mockResolvedValue([]);
      (calculateMonthlyReadings as jest.Mock).mockReturnValue([]);
      mockDisplayRepo.upsert.mockResolvedValue({
        _id: 'display-3',
        userId,
        displayType: 'monthly-chart-power',
        data: [],
        calculatedAt: new Date(),
        sourceDataHash: expect.any(String),
      });

      const result = await service.calculateMonthlyChartData(userId, year, 'power');

      expect(result.data).toEqual([]);
      expect(mockDisplayRepo.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            sourceReadingCount: 0,
          }),
        })
      );
    });

    it('should propagate repository errors', async () => {
      mockEnergyRepo.findByDateRange.mockRejectedValue(new Error('DB error'));

      await expect(
        service.calculateMonthlyChartData(userId, year, 'power')
      ).rejects.toThrow('DB error');
    });
  });

  describe('calculateHistogramData()', () => {
    const mockHistogramBuckets: HistogramBucket[] = [
      { startDate: new Date('2024-01-01'), endDate: new Date('2024-01-02'), count: 5 },
      { startDate: new Date('2024-01-02'), endDate: new Date('2024-01-03'), count: 3 },
    ];

    beforeEach(() => {
      // Mock DataAggregationService
      (aggregateDataIntoBuckets as jest.Mock).mockReturnValue(
        mockHistogramBuckets
      );
    });

    it('should fetch readings for the specified date range and type', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      const readings = [createReading()];
      mockEnergyRepo.findByDateRange.mockResolvedValue(readings);
      mockDisplayRepo.upsert.mockResolvedValue({
        _id: 'display-1',
        userId,
        displayType: 'histogram-power',
        data: mockHistogramBuckets,
        calculatedAt: new Date(),
        sourceDataHash: 'hash123',
      });

      await service.calculateHistogramData(userId, 'power', startDate, endDate, 60);

      expect(mockEnergyRepo.findByDateRange).toHaveBeenCalledWith(
        userId,
        startDate,
        endDate,
        'power'
      );
    });

    it('should use DataAggregationService to calculate histogram', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      const bucketCount = 60;
      const readings = [createReading(), createReading({ _id: 'r2' })];
      mockEnergyRepo.findByDateRange.mockResolvedValue(readings);
      mockDisplayRepo.upsert.mockResolvedValue({
        _id: 'display-1',
        userId,
        displayType: 'histogram-power',
        data: mockHistogramBuckets,
        calculatedAt: new Date(),
        sourceDataHash: 'hash123',
      });

      await service.calculateHistogramData(userId, 'power', startDate, endDate, bucketCount);

      expect(aggregateDataIntoBuckets).toHaveBeenCalledWith(
        readings,
        startDate,
        endDate,
        bucketCount
      );
    });

    it('should use default bucket count of 60 if not specified', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      const readings = [createReading()];
      mockEnergyRepo.findByDateRange.mockResolvedValue(readings);
      mockDisplayRepo.upsert.mockResolvedValue({
        _id: 'display-1',
        userId,
        displayType: 'histogram-power',
        data: mockHistogramBuckets,
        calculatedAt: new Date(),
        sourceDataHash: 'hash123',
      });

      await service.calculateHistogramData(userId, 'power', startDate, endDate);

      expect(aggregateDataIntoBuckets).toHaveBeenCalledWith(
        readings,
        startDate,
        endDate,
        60 // default
      );
    });

    it('should generate hash from source readings', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      const readings = [
        createReading({ _id: 'r1', date: new Date('2024-01-15T10:00:00Z') }),
        createReading({ _id: 'r2', date: new Date('2024-02-20T15:30:00Z') }),
      ];
      mockEnergyRepo.findByDateRange.mockResolvedValue(readings);
      mockDisplayRepo.upsert.mockResolvedValue({
        _id: 'display-1',
        userId,
        displayType: 'histogram-power',
        data: mockHistogramBuckets,
        calculatedAt: new Date(),
        sourceDataHash: 'hash123',
      });

      await service.calculateHistogramData(userId, 'power', startDate, endDate);

      expect(mockDisplayRepo.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          sourceDataHash: expect.any(String),
        })
      );

      const call = mockDisplayRepo.upsert.mock.calls[0][0];
      expect(call.sourceDataHash.length).toBe(64); // SHA256 hex
    });

    it('should upsert display data with correct structure', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      const bucketCount = 100;
      const readings = [createReading()];
      mockEnergyRepo.findByDateRange.mockResolvedValue(readings);
      mockDisplayRepo.upsert.mockResolvedValue({
        _id: 'display-1',
        userId,
        displayType: 'histogram-power',
        data: mockHistogramBuckets,
        calculatedAt: new Date(),
        sourceDataHash: 'hash123',
      });

      const result = await service.calculateHistogramData(
        userId,
        'power',
        startDate,
        endDate,
        bucketCount
      );

      expect(mockDisplayRepo.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          displayType: 'histogram-power',
          data: mockHistogramBuckets,
          calculatedAt: expect.any(Date),
          sourceDataHash: expect.any(String),
          metadata: expect.objectContaining({
            sourceReadingCount: 1,
            calculationTimeMs: expect.any(Number),
            filters: { type: 'power', startDate, endDate, bucketCount },
          }),
        })
      );

      expect(result).toEqual(
        expect.objectContaining({
          userId,
          displayType: 'histogram-power',
        })
      );
    });

    it('should handle gas type correctly', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      const readings = [createReading({ type: 'gas' })];
      mockEnergyRepo.findByDateRange.mockResolvedValue(readings);
      mockDisplayRepo.upsert.mockResolvedValue({
        _id: 'display-2',
        userId,
        displayType: 'histogram-gas',
        data: mockHistogramBuckets,
        calculatedAt: new Date(),
        sourceDataHash: 'hash456',
      });

      await service.calculateHistogramData(userId, 'gas', startDate, endDate);

      expect(mockEnergyRepo.findByDateRange).toHaveBeenCalledWith(
        userId,
        startDate,
        endDate,
        'gas'
      );
      expect(mockDisplayRepo.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          displayType: 'histogram-gas',
        })
      );
    });

    it('should handle empty readings array', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      mockEnergyRepo.findByDateRange.mockResolvedValue([]);
      (aggregateDataIntoBuckets as jest.Mock).mockReturnValue([]);
      mockDisplayRepo.upsert.mockResolvedValue({
        _id: 'display-3',
        userId,
        displayType: 'histogram-power',
        data: [],
        calculatedAt: new Date(),
        sourceDataHash: expect.any(String),
      });

      const result = await service.calculateHistogramData(userId, 'power', startDate, endDate);

      expect(result.data).toEqual([]);
      expect(mockDisplayRepo.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            sourceReadingCount: 0,
          }),
        })
      );
    });

    it('should propagate repository errors', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      mockEnergyRepo.findByDateRange.mockRejectedValue(new Error('Network error'));

      await expect(
        service.calculateHistogramData(userId, 'power', startDate, endDate)
      ).rejects.toThrow('Network error');
    });
  });

  describe('invalidateAllForUser()', () => {
    it('should call repository invalidateForUser method', async () => {
      mockDisplayRepo.invalidateForUser.mockResolvedValue(undefined);

      await service.invalidateAllForUser(userId);

      expect(mockDisplayRepo.invalidateForUser).toHaveBeenCalledWith(userId);
    });

    it('should propagate repository errors', async () => {
      mockDisplayRepo.invalidateForUser.mockRejectedValue(new Error('Invalidation failed'));

      await expect(service.invalidateAllForUser(userId)).rejects.toThrow(
        'Invalidation failed'
      );
    });
  });

  describe('Hash generation', () => {
    it('should generate consistent hashes for same readings', async () => {
      const readings = [
        createReading({ _id: 'r1', date: new Date('2024-01-15T10:00:00Z') }),
        createReading({ _id: 'r2', date: new Date('2024-02-20T15:30:00Z') }),
      ];
      mockEnergyRepo.findByDateRange.mockResolvedValue(readings);

      let hash1: string = '';
      let hash2: string = '';

      mockDisplayRepo.upsert.mockImplementation((data) => {
        if (!hash1) {
          hash1 = data.sourceDataHash;
        } else {
          hash2 = data.sourceDataHash;
        }
        return Promise.resolve({
          ...data,
          _id: 'display-1',
        } as DisplayEnergyData);
      });

      await service.calculateMonthlyChartData(userId, year, 'power');
      await service.calculateMonthlyChartData(userId, year, 'power');

      expect(hash1).toBe(hash2);
    });

    it('should generate different hashes for different readings', async () => {
      const readings1 = [createReading({ _id: 'r1', date: new Date('2024-01-15') })];
      const readings2 = [createReading({ _id: 'r2', date: new Date('2024-02-20') })];

      let hash1: string = '';
      let hash2: string = '';

      mockDisplayRepo.upsert.mockImplementation((data) => {
        if (!hash1) {
          hash1 = data.sourceDataHash;
        } else {
          hash2 = data.sourceDataHash;
        }
        return Promise.resolve({
          ...data,
          _id: 'display-1',
        } as DisplayEnergyData);
      });

      mockEnergyRepo.findByDateRange.mockResolvedValueOnce(readings1);
      await service.calculateMonthlyChartData(userId, year, 'power');

      mockEnergyRepo.findByDateRange.mockResolvedValueOnce(readings2);
      await service.calculateMonthlyChartData(userId, year, 'power');

      expect(hash1).not.toBe(hash2);
    });

    it('should handle empty readings array in hash generation', async () => {
      mockEnergyRepo.findByDateRange.mockResolvedValue([]);
      (calculateMonthlyReadings as jest.Mock).mockReturnValue([]);
      mockDisplayRepo.upsert.mockResolvedValue({
        _id: 'display-1',
        userId,
        displayType: 'monthly-chart-power',
        data: [],
        calculatedAt: new Date(),
        sourceDataHash: 'hash-empty',
      });

      await service.calculateMonthlyChartData(userId, year, 'power');

      expect(mockDisplayRepo.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          sourceDataHash: expect.any(String),
        })
      );
    });
  });

  describe('Performance and timing', () => {
    it('should track calculation time in metadata', async () => {
      const readings = [createReading()];
      mockEnergyRepo.findByDateRange.mockResolvedValue(readings);
      (calculateMonthlyReadings as jest.Mock).mockReturnValue([]);
      mockDisplayRepo.upsert.mockResolvedValue({
        _id: 'display-1',
        userId,
        displayType: 'monthly-chart-power',
        data: [],
        calculatedAt: new Date(),
        sourceDataHash: 'hash123',
      });

      await service.calculateMonthlyChartData(userId, year, 'power');

      const upsertCall = mockDisplayRepo.upsert.mock.calls[0][0];
      expect(upsertCall.metadata?.calculationTimeMs).toBeGreaterThanOrEqual(0);
      expect(typeof upsertCall.metadata?.calculationTimeMs).toBe('number');
    });

    it('should have calculatedAt timestamp close to current time', async () => {
      const readings = [createReading()];
      mockEnergyRepo.findByDateRange.mockResolvedValue(readings);
      (calculateMonthlyReadings as jest.Mock).mockReturnValue([]);
      mockDisplayRepo.upsert.mockResolvedValue({
        _id: 'display-1',
        userId,
        displayType: 'monthly-chart-power',
        data: [],
        calculatedAt: new Date(),
        sourceDataHash: 'hash123',
      });

      const beforeTime = Date.now();
      await service.calculateMonthlyChartData(userId, year, 'power');
      const afterTime = Date.now();

      const upsertCall = mockDisplayRepo.upsert.mock.calls[0][0];
      const calculatedAtTime = upsertCall.calculatedAt.getTime();

      expect(calculatedAtTime).toBeGreaterThanOrEqual(beforeTime);
      expect(calculatedAtTime).toBeLessThanOrEqual(afterTime);
    });
  });

  describe('getDisplayData() - NEW for Phase 2', () => {
    it('should retrieve cached display data by type and filters', async () => {
      const mockDisplayData: DisplayEnergyData = {
        _id: 'display-1',
        userId,
        displayType: 'monthly-chart-power',
        data: [{ month: 1, monthLabel: 'Jan', meterReading: 1000 }],
        calculatedAt: new Date(),
        sourceDataHash: 'hash123',
        metadata: {
          sourceReadingCount: 5,
          calculationTimeMs: 10,
          filters: { year: 2024, type: 'power' },
        },
      };

      mockDisplayRepo.findByTypeAndFilters.mockResolvedValue(mockDisplayData);

      const result = await service.getDisplayData(
        userId,
        'monthly-chart-power',
        { year: 2024, type: 'power' }
      );

      expect(mockDisplayRepo.findByTypeAndFilters).toHaveBeenCalledWith(
        userId,
        'monthly-chart-power',
        { year: 2024, type: 'power' }
      );
      expect(result).toEqual(mockDisplayData);
    });

    it('should return null when no cached data exists', async () => {
      mockDisplayRepo.findByTypeAndFilters.mockResolvedValue(null);

      const result = await service.getDisplayData(
        userId,
        'monthly-chart-power',
        { year: 2024 }
      );

      expect(result).toBeNull();
    });

    it('should handle histogram data type', async () => {
      const mockHistogramData: DisplayEnergyData = {
        _id: 'display-2',
        userId,
        displayType: 'histogram-gas',
        data: [{ start: new Date(), end: new Date(), count: 5 }],
        calculatedAt: new Date(),
        sourceDataHash: 'hash456',
      };

      mockDisplayRepo.findByTypeAndFilters.mockResolvedValue(mockHistogramData);

      const result = await service.getDisplayData(userId, 'histogram-gas');

      expect(result).toEqual(mockHistogramData);
      expect(result?.displayType).toBe('histogram-gas');
    });

    it('should handle filters as undefined', async () => {
      mockDisplayRepo.findByTypeAndFilters.mockResolvedValue(null);

      await service.getDisplayData(userId, 'table-data');

      expect(mockDisplayRepo.findByTypeAndFilters).toHaveBeenCalledWith(
        userId,
        'table-data',
        {}
      );
    });
  });

  describe('calculateDisplayData() - NEW for Phase 2', () => {
    it('should calculate monthly chart data on-demand', async () => {
      const readings = [createReading()];
      const mockMonthlyData: MonthlyDataPoint[] = [
        {
          month: 1,
          monthLabel: 'Jan',
          meterReading: 1000,
          isActual: true,
          isInterpolated: false,
          isExtrapolated: false,
        },
      ];

      mockEnergyRepo.findByDateRange.mockResolvedValue(readings);
      (calculateMonthlyReadings as jest.Mock).mockReturnValue(mockMonthlyData);
      mockDisplayRepo.upsert.mockResolvedValue({
        _id: 'display-1',
        userId,
        displayType: 'monthly-chart-power',
        data: mockMonthlyData,
        calculatedAt: new Date(),
        sourceDataHash: 'hash123',
      });

      const result = await service.calculateDisplayData(
        userId,
        'monthly-chart-power',
        { year: 2024, type: 'power' }
      );

      expect(result).toBeDefined();
      expect(result.data).toEqual(mockMonthlyData);
      expect(result.displayType).toBe('monthly-chart-power');
    });

    it('should calculate histogram data on-demand', async () => {
      const readings = [createReading()];
      const mockHistogramData: HistogramBucket[] = [
        {
          count: 5,
          totalAmount: 5000,
        },
      ];

      mockEnergyRepo.findByDateRange.mockResolvedValue(readings);
      (aggregateDataIntoBuckets as jest.Mock).mockReturnValue(mockHistogramData);
      mockDisplayRepo.upsert.mockResolvedValue({
        _id: 'display-2',
        userId,
        displayType: 'histogram-power',
        data: mockHistogramData,
        calculatedAt: new Date(),
        sourceDataHash: 'hash456',
      });

      const result = await service.calculateDisplayData(
        userId,
        'histogram-power',
        {
          type: 'power',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31'),
          bucketCount: 60,
        }
      );

      expect(result).toBeDefined();
      expect(result.data).toEqual(mockHistogramData);
      expect(result.displayType).toBe('histogram-power');
    });

    it('should throw error for unsupported display type', async () => {
      await expect(
        service.calculateDisplayData(userId, 'table-data')
      ).rejects.toThrow('Unsupported display type');
    });

    it('should parse year from filters for monthly chart', async () => {
      const readings = [createReading()];
      mockEnergyRepo.findByDateRange.mockResolvedValue(readings);
      (calculateMonthlyReadings as jest.Mock).mockReturnValue([]);
      mockDisplayRepo.upsert.mockResolvedValue({
        _id: 'display-1',
        userId,
        displayType: 'monthly-chart-power',
        data: [],
        calculatedAt: new Date(),
        sourceDataHash: 'hash123',
      });

      await service.calculateDisplayData(userId, 'monthly-chart-power', {
        year: 2024,
        type: 'power',
      });

      expect(mockEnergyRepo.findByDateRange).toHaveBeenCalledWith(
        userId,
        new Date(2024, 0, 1),
        expect.any(Date),
        'power'
      );
    });
  });
});
