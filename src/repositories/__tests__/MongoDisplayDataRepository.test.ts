/**
 * Tests for MongoDisplayDataRepository
 * Following TDD: Write tests first, then implement
 */

// Mock dependencies BEFORE imports
jest.mock('@/lib/mongodb', () => ({
  connectDB: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/models/DisplayEnergyData', () => ({
  DisplayEnergyDataModel: {
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    deleteOne: jest.fn(),
    deleteMany: jest.fn(),
  },
}));

import { MongoDisplayDataRepository } from '../mongodb/MongoDisplayDataRepository';
import { DisplayEnergyData, DisplayDataType } from '@/app/types';
import { connectDB } from '@/lib/mongodb';
import { DisplayEnergyDataModel } from '@/models/DisplayEnergyData';

describe('MongoDisplayDataRepository', () => {
  let repository: MongoDisplayDataRepository;
  const mockUserId = 'test-user-123';

  // Helper to create test display data
  const createDisplayData = (
    displayType: DisplayDataType,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any,
    sourceDataHash: string = 'hash-123'
  ): Omit<DisplayEnergyData, '_id'> => ({
    userId: mockUserId,
    displayType,
    data,
    calculatedAt: new Date(),
    sourceDataHash,
    metadata: {
      sourceReadingCount: 10,
      calculationTimeMs: 50,
      filters: {},
    },
  });

  // Helper to create full display data with ID
  const createFullDisplayData = (
    id: string,
    displayType: DisplayDataType,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any,
    sourceDataHash: string = 'hash-123'
  ): DisplayEnergyData => ({
    _id: id,
    userId: mockUserId,
    displayType,
    data,
    calculatedAt: new Date(),
    sourceDataHash,
    metadata: {
      sourceReadingCount: 10,
      calculationTimeMs: 50,
      filters: {},
    },
  });

  beforeEach(() => {
    repository = new MongoDisplayDataRepository();
    jest.clearAllMocks();
    (connectDB as jest.Mock).mockResolvedValue(undefined);
  });

  describe('upsert', () => {
    it('should insert new display data when none exists', async () => {
      const displayData = createDisplayData(
        'monthly-chart-power',
        { months: [1, 2, 3] },
        'hash-abc'
      );
      const expectedData = createFullDisplayData(
        'display-1',
        'monthly-chart-power',
        { months: [1, 2, 3] },
        'hash-abc'
      );

      const mockExec = jest.fn().mockResolvedValue(expectedData);
      const mockWhere = jest.fn().mockReturnValue({ exec: mockExec });
      (DisplayEnergyDataModel.findOneAndUpdate as jest.Mock).mockReturnValue({
        where: mockWhere,
        exec: mockExec,
      });

      const result = await repository.upsert(displayData);

      expect(connectDB).toHaveBeenCalled();
      expect(DisplayEnergyDataModel.findOneAndUpdate).toHaveBeenCalledWith(
        { userId: mockUserId, displayType: 'monthly-chart-power' },
        displayData,
        { upsert: true, new: true }
      );
      expect(result).toEqual(expectedData);
      expect(result._id).toBe('display-1');
    });

    it('should update existing display data', async () => {
      const displayData = createDisplayData(
        'monthly-chart-power',
        { months: [4, 5, 6] },
        'hash-xyz'
      );
      const expectedData = createFullDisplayData(
        'display-1',
        'monthly-chart-power',
        { months: [4, 5, 6] },
        'hash-xyz'
      );

      const mockExec = jest.fn().mockResolvedValue(expectedData);
      const mockWhere = jest.fn().mockReturnValue({ exec: mockExec });
      (DisplayEnergyDataModel.findOneAndUpdate as jest.Mock).mockReturnValue({
        where: mockWhere,
        exec: mockExec,
      });

      const result = await repository.upsert(displayData);

      expect(result.sourceDataHash).toBe('hash-xyz');
      expect(result.data).toEqual({ months: [4, 5, 6] });
    });

    it('should handle different display types independently', async () => {
      const powerData = createDisplayData('monthly-chart-power', { power: 100 });
      const gasData = createDisplayData('monthly-chart-gas', { gas: 50 });

      const mockExec = jest.fn()
        .mockResolvedValueOnce(createFullDisplayData('display-1', 'monthly-chart-power', { power: 100 }))
        .mockResolvedValueOnce(createFullDisplayData('display-2', 'monthly-chart-gas', { gas: 50 }));
      const mockWhere = jest.fn().mockReturnValue({ exec: mockExec });
      (DisplayEnergyDataModel.findOneAndUpdate as jest.Mock).mockReturnValue({
        where: mockWhere,
        exec: mockExec,
      });

      await repository.upsert(powerData);
      await repository.upsert(gasData);

      expect(DisplayEnergyDataModel.findOneAndUpdate).toHaveBeenCalledTimes(2);
      expect(DisplayEnergyDataModel.findOneAndUpdate).toHaveBeenNthCalledWith(
        1,
        { userId: mockUserId, displayType: 'monthly-chart-power' },
        powerData,
        { upsert: true, new: true }
      );
      expect(DisplayEnergyDataModel.findOneAndUpdate).toHaveBeenNthCalledWith(
        2,
        { userId: mockUserId, displayType: 'monthly-chart-gas' },
        gasData,
        { upsert: true, new: true }
      );
    });

    it('should propagate error on database failure', async () => {
      const displayData = createDisplayData('monthly-chart-power', { data: 'test' });
      const dbError = new Error('Database upsert failed');

      const mockExec = jest.fn().mockRejectedValue(dbError);
      const mockWhere = jest.fn().mockReturnValue({ exec: mockExec });
      (DisplayEnergyDataModel.findOneAndUpdate as jest.Mock).mockReturnValue({
        where: mockWhere,
        exec: mockExec,
      });

      await expect(repository.upsert(displayData)).rejects.toThrow('Database upsert failed');
    });

    it('should preserve metadata when upserting', async () => {
      const displayData = createDisplayData('histogram-power', { buckets: [1, 2, 3] });
      displayData.metadata = {
        sourceReadingCount: 100,
        calculationTimeMs: 250,
        filters: { year: 2024 },
      };

      const expectedData = createFullDisplayData('display-1', 'histogram-power', { buckets: [1, 2, 3] });
      expectedData.metadata = displayData.metadata;

      const mockExec = jest.fn().mockResolvedValue(expectedData);
      const mockWhere = jest.fn().mockReturnValue({ exec: mockExec });
      (DisplayEnergyDataModel.findOneAndUpdate as jest.Mock).mockReturnValue({
        where: mockWhere,
        exec: mockExec,
      });

      const result = await repository.upsert(displayData);

      expect(result.metadata?.sourceReadingCount).toBe(100);
      expect(result.metadata?.calculationTimeMs).toBe(250);
      expect(result.metadata?.filters).toEqual({ year: 2024 });
    });
  });

  describe('findByType', () => {
    it('should find display data by type', async () => {
      const expectedData = createFullDisplayData(
        'display-1',
        'monthly-chart-power',
        { months: [1, 2, 3] }
      );

      const mockExec = jest.fn().mockResolvedValue(expectedData);
      const mockWhere = jest.fn().mockReturnValue({ exec: mockExec });
      (DisplayEnergyDataModel.findOne as jest.Mock).mockReturnValue({
        where: mockWhere,
        exec: mockExec,
      });

      const result = await repository.findByType(mockUserId, 'monthly-chart-power');

      expect(connectDB).toHaveBeenCalled();
      expect(DisplayEnergyDataModel.findOne).toHaveBeenCalledWith({
        userId: mockUserId,
        displayType: 'monthly-chart-power',
      });
      expect(result).toEqual(expectedData);
    });

    it('should return null when display data not found', async () => {
      const mockExec = jest.fn().mockResolvedValue(null);
      const mockWhere = jest.fn().mockReturnValue({ exec: mockExec });
      (DisplayEnergyDataModel.findOne as jest.Mock).mockReturnValue({
        where: mockWhere,
        exec: mockExec,
      });

      const result = await repository.findByType(mockUserId, 'monthly-chart-gas');

      expect(result).toBeNull();
    });

    it('should enforce user data isolation', async () => {
      const mockExec = jest.fn().mockResolvedValue(null);
      const mockWhere = jest.fn().mockReturnValue({ exec: mockExec });
      (DisplayEnergyDataModel.findOne as jest.Mock).mockReturnValue({
        where: mockWhere,
        exec: mockExec,
      });

      await repository.findByType('different-user', 'monthly-chart-power');

      expect(DisplayEnergyDataModel.findOne).toHaveBeenCalledWith({
        userId: 'different-user',
        displayType: 'monthly-chart-power',
      });
    });

    it('should find different display types independently', async () => {
      const powerData = createFullDisplayData('display-1', 'monthly-chart-power', { power: 100 });
      const gasData = createFullDisplayData('display-2', 'monthly-chart-gas', { gas: 50 });

      const mockExec = jest.fn()
        .mockResolvedValueOnce(powerData)
        .mockResolvedValueOnce(gasData);
      const mockWhere = jest.fn().mockReturnValue({ exec: mockExec });
      (DisplayEnergyDataModel.findOne as jest.Mock).mockReturnValue({
        where: mockWhere,
        exec: mockExec,
      });

      const powerResult = await repository.findByType(mockUserId, 'monthly-chart-power');
      const gasResult = await repository.findByType(mockUserId, 'monthly-chart-gas');

      expect(powerResult?.displayType).toBe('monthly-chart-power');
      expect(gasResult?.displayType).toBe('monthly-chart-gas');
    });
  });

  describe('findByTypeAndFilters', () => {
    it('should find display data by type and filters', async () => {
      const filters = { year: 2024 };
      const expectedData = createFullDisplayData('display-1', 'monthly-chart-power', { data: 'test' });
      expectedData.metadata = { sourceReadingCount: 10, calculationTimeMs: 50, filters };

      const mockExec = jest.fn().mockResolvedValue(expectedData);
      const mockWhere = jest.fn().mockReturnValue({ exec: mockExec });
      (DisplayEnergyDataModel.findOne as jest.Mock).mockReturnValue({
        where: mockWhere,
        exec: mockExec,
      });

      const result = await repository.findByTypeAndFilters(
        mockUserId,
        'monthly-chart-power',
        filters
      );

      expect(connectDB).toHaveBeenCalled();
      expect(DisplayEnergyDataModel.findOne).toHaveBeenCalledWith({
        userId: mockUserId,
        displayType: 'monthly-chart-power',
        'metadata.filters': filters,
      });
      expect(result).toEqual(expectedData);
    });

    it('should return null when no match found', async () => {
      const mockExec = jest.fn().mockResolvedValue(null);
      const mockWhere = jest.fn().mockReturnValue({ exec: mockExec });
      (DisplayEnergyDataModel.findOne as jest.Mock).mockReturnValue({
        where: mockWhere,
        exec: mockExec,
      });

      const result = await repository.findByTypeAndFilters(
        mockUserId,
        'histogram-power',
        { year: 2023 }
      );

      expect(result).toBeNull();
    });

    it('should enforce user data isolation', async () => {
      const mockExec = jest.fn().mockResolvedValue(null);
      const mockWhere = jest.fn().mockReturnValue({ exec: mockExec });
      (DisplayEnergyDataModel.findOne as jest.Mock).mockReturnValue({
        where: mockWhere,
        exec: mockExec,
      });

      await repository.findByTypeAndFilters('different-user', 'table-data', { page: 1 });

      expect(DisplayEnergyDataModel.findOne).toHaveBeenCalledWith({
        userId: 'different-user',
        displayType: 'table-data',
        'metadata.filters': { page: 1 },
      });
    });

    it('should handle complex filter objects', async () => {
      const complexFilters = {
        year: 2024,
        month: 6,
        type: 'power',
        range: { start: '2024-01-01', end: '2024-12-31' },
      };

      const mockExec = jest.fn().mockResolvedValue(null);
      const mockWhere = jest.fn().mockReturnValue({ exec: mockExec });
      (DisplayEnergyDataModel.findOne as jest.Mock).mockReturnValue({
        where: mockWhere,
        exec: mockExec,
      });

      await repository.findByTypeAndFilters(mockUserId, 'histogram-power', complexFilters);

      expect(DisplayEnergyDataModel.findOne).toHaveBeenCalledWith({
        userId: mockUserId,
        displayType: 'histogram-power',
        'metadata.filters': complexFilters,
      });
    });
  });

  describe('deleteByType', () => {
    it('should delete display data by type', async () => {
      const mockExec = jest.fn().mockResolvedValue({ deletedCount: 1 });
      const mockWhere = jest.fn().mockReturnValue({ exec: mockExec });
      (DisplayEnergyDataModel.deleteOne as jest.Mock).mockReturnValue({
        where: mockWhere,
        exec: mockExec,
      });

      const result = await repository.deleteByType(mockUserId, 'monthly-chart-power');

      expect(connectDB).toHaveBeenCalled();
      expect(DisplayEnergyDataModel.deleteOne).toHaveBeenCalledWith({
        userId: mockUserId,
        displayType: 'monthly-chart-power',
      });
      expect(result).toBe(true);
    });

    it('should return false when display data not found', async () => {
      const mockExec = jest.fn().mockResolvedValue({ deletedCount: 0 });
      const mockWhere = jest.fn().mockReturnValue({ exec: mockExec });
      (DisplayEnergyDataModel.deleteOne as jest.Mock).mockReturnValue({
        where: mockWhere,
        exec: mockExec,
      });

      const result = await repository.deleteByType(mockUserId, 'monthly-chart-gas');

      expect(result).toBe(false);
    });

    it('should enforce user data isolation', async () => {
      const mockExec = jest.fn().mockResolvedValue({ deletedCount: 0 });
      const mockWhere = jest.fn().mockReturnValue({ exec: mockExec });
      (DisplayEnergyDataModel.deleteOne as jest.Mock).mockReturnValue({
        where: mockWhere,
        exec: mockExec,
      });

      await repository.deleteByType('different-user', 'histogram-power');

      expect(DisplayEnergyDataModel.deleteOne).toHaveBeenCalledWith({
        userId: 'different-user',
        displayType: 'histogram-power',
      });
    });

    it('should delete specific types without affecting others', async () => {
      const mockExec = jest.fn()
        .mockResolvedValueOnce({ deletedCount: 1 })
        .mockResolvedValueOnce({ deletedCount: 1 });
      const mockWhere = jest.fn().mockReturnValue({ exec: mockExec });
      (DisplayEnergyDataModel.deleteOne as jest.Mock).mockReturnValue({
        where: mockWhere,
        exec: mockExec,
      });

      const powerResult = await repository.deleteByType(mockUserId, 'monthly-chart-power');
      const gasResult = await repository.deleteByType(mockUserId, 'monthly-chart-gas');

      expect(powerResult).toBe(true);
      expect(gasResult).toBe(true);
      expect(DisplayEnergyDataModel.deleteOne).toHaveBeenCalledTimes(2);
    });
  });

  describe('deleteAllForUser', () => {
    it('should delete all display data for a user', async () => {
      const mockExec = jest.fn().mockResolvedValue({ deletedCount: 5 });
      const mockWhere = jest.fn().mockReturnValue({ exec: mockExec });
      (DisplayEnergyDataModel.deleteMany as jest.Mock).mockReturnValue({
        where: mockWhere,
        exec: mockExec,
      });

      const result = await repository.deleteAllForUser(mockUserId);

      expect(connectDB).toHaveBeenCalled();
      expect(DisplayEnergyDataModel.deleteMany).toHaveBeenCalledWith({
        userId: mockUserId,
      });
      expect(result).toBe(5);
    });

    it('should return 0 when no data exists for user', async () => {
      const mockExec = jest.fn().mockResolvedValue({ deletedCount: 0 });
      const mockWhere = jest.fn().mockReturnValue({ exec: mockExec });
      (DisplayEnergyDataModel.deleteMany as jest.Mock).mockReturnValue({
        where: mockWhere,
        exec: mockExec,
      });

      const result = await repository.deleteAllForUser(mockUserId);

      expect(result).toBe(0);
    });

    it('should enforce user data isolation', async () => {
      const mockExec = jest.fn().mockResolvedValue({ deletedCount: 3 });
      const mockWhere = jest.fn().mockReturnValue({ exec: mockExec });
      (DisplayEnergyDataModel.deleteMany as jest.Mock).mockReturnValue({
        where: mockWhere,
        exec: mockExec,
      });

      await repository.deleteAllForUser('different-user');

      expect(DisplayEnergyDataModel.deleteMany).toHaveBeenCalledWith({
        userId: 'different-user',
      });
    });

    it('should propagate error on database failure', async () => {
      const dbError = new Error('Delete failed');

      const mockExec = jest.fn().mockRejectedValue(dbError);
      const mockWhere = jest.fn().mockReturnValue({ exec: mockExec });
      (DisplayEnergyDataModel.deleteMany as jest.Mock).mockReturnValue({
        where: mockWhere,
        exec: mockExec,
      });

      await expect(repository.deleteAllForUser(mockUserId)).rejects.toThrow('Delete failed');
    });
  });

  describe('invalidateForUser', () => {
    it('should invalidate all display data for a user', async () => {
      const mockExec = jest.fn().mockResolvedValue({ deletedCount: 3 });
      const mockWhere = jest.fn().mockReturnValue({ exec: mockExec });
      (DisplayEnergyDataModel.deleteMany as jest.Mock).mockReturnValue({
        where: mockWhere,
        exec: mockExec,
      });

      await repository.invalidateForUser(mockUserId);

      expect(connectDB).toHaveBeenCalled();
      expect(DisplayEnergyDataModel.deleteMany).toHaveBeenCalledWith({
        userId: mockUserId,
      });
    });

    it('should complete successfully even when no data exists', async () => {
      const mockExec = jest.fn().mockResolvedValue({ deletedCount: 0 });
      const mockWhere = jest.fn().mockReturnValue({ exec: mockExec });
      (DisplayEnergyDataModel.deleteMany as jest.Mock).mockReturnValue({
        where: mockWhere,
        exec: mockExec,
      });

      await expect(repository.invalidateForUser(mockUserId)).resolves.not.toThrow();
    });

    it('should enforce user data isolation', async () => {
      const mockExec = jest.fn().mockResolvedValue({ deletedCount: 2 });
      const mockWhere = jest.fn().mockReturnValue({ exec: mockExec });
      (DisplayEnergyDataModel.deleteMany as jest.Mock).mockReturnValue({
        where: mockWhere,
        exec: mockExec,
      });

      await repository.invalidateForUser('different-user');

      expect(DisplayEnergyDataModel.deleteMany).toHaveBeenCalledWith({
        userId: 'different-user',
      });
    });

    it('should propagate error on database failure', async () => {
      const dbError = new Error('Invalidation failed');

      const mockExec = jest.fn().mockRejectedValue(dbError);
      const mockWhere = jest.fn().mockReturnValue({ exec: mockExec });
      (DisplayEnergyDataModel.deleteMany as jest.Mock).mockReturnValue({
        where: mockWhere,
        exec: mockExec,
      });

      await expect(repository.invalidateForUser(mockUserId)).rejects.toThrow('Invalidation failed');
    });
  });
});
