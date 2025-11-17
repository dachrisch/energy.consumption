/**
 * Tests for MongoEnergyRepository
 * Following TDD: Write tests first, then implement
 */

// Mock dependencies BEFORE imports
jest.mock('@/lib/mongodb', () => ({
  connectDB: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/models/SourceEnergyReading', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mockConstructor = jest.fn() as any;
  return {
    SourceEnergyReadingModel: Object.assign(mockConstructor, {
      find: jest.fn(),
      findById: jest.fn(),
      findOne: jest.fn(),
      findOneAndUpdate: jest.fn(),
      deleteOne: jest.fn(),
      deleteMany: jest.fn(),
      countDocuments: jest.fn(),
      insertMany: jest.fn(),
    }),
  };
});

import { MongoEnergyRepository } from '../mongodb/MongoEnergyRepository';
import { SourceEnergyReading, EnergyFilters } from '@/app/types';
import { connectDB } from '@/lib/mongodb';
import { SourceEnergyReadingModel } from '@/models/SourceEnergyReading';

describe('MongoEnergyRepository', () => {
  let repository: MongoEnergyRepository;
  const mockUserId = 'test-user-123';

  // Helper to create test reading data
  const createReadingData = (
    date: Date,
    amount: number,
    type: 'power' | 'gas' = 'power'
  ): Omit<SourceEnergyReading, '_id' | 'createdAt' | 'updatedAt'> => ({
    userId: mockUserId,
    type,
    amount,
    date,
  });

  // Helper to create full reading with ID and timestamps
  const createFullReading = (
    id: string,
    date: Date,
    amount: number,
    type: 'power' | 'gas' = 'power'
  ): SourceEnergyReading => ({
    _id: id,
    userId: mockUserId,
    type,
    amount,
    date,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  beforeEach(() => {
    repository = new MongoEnergyRepository();
    jest.clearAllMocks();
    (connectDB as jest.Mock).mockResolvedValue(undefined);
  });

  describe('create', () => {
    it('should create a new energy reading', async () => {
      const readingData = createReadingData(new Date(2024, 0, 1), 1000);
      const expectedReading = createFullReading('reading-1', new Date(2024, 0, 1), 1000);

      const mockSave = jest.fn().mockResolvedValue(expectedReading);
      (SourceEnergyReadingModel as unknown as jest.Mock).mockImplementation(() => ({
        save: mockSave,
      }));

      const result = await repository.create(readingData);

      expect(connectDB).toHaveBeenCalled();
      expect(mockSave).toHaveBeenCalled();
      expect(result).toEqual(expectedReading);
      expect(result._id).toBe('reading-1');
      expect(result.userId).toBe(mockUserId);
    });

    it('should propagate error on database failure', async () => {
      const readingData = createReadingData(new Date(2024, 0, 1), 1000);
      const dbError = new Error('Database connection failed');

      const mockSave = jest.fn().mockRejectedValue(dbError);
      (SourceEnergyReadingModel as unknown as jest.Mock).mockImplementation(() => ({
        save: mockSave,
      }));

      await expect(repository.create(readingData)).rejects.toThrow('Database connection failed');
    });

    it('should handle creation with different energy types', async () => {
      const gasReading = createReadingData(new Date(2024, 0, 1), 500, 'gas');
      const expectedReading = createFullReading('reading-2', new Date(2024, 0, 1), 500, 'gas');

      const mockSave = jest.fn().mockResolvedValue(expectedReading);
      (SourceEnergyReadingModel as unknown as jest.Mock).mockImplementation(() => ({
        save: mockSave,
      }));

      const result = await repository.create(gasReading);

      expect(result.type).toBe('gas');
      expect(result.amount).toBe(500);
    });
  });

  describe('createMany', () => {
    it('should create multiple readings in bulk', async () => {
      const readings = [
        createReadingData(new Date(2024, 0, 1), 1000),
        createReadingData(new Date(2024, 0, 2), 1010),
        createReadingData(new Date(2024, 0, 3), 1020),
      ];

      const expectedReadings = [
        createFullReading('reading-1', new Date(2024, 0, 1), 1000),
        createFullReading('reading-2', new Date(2024, 0, 2), 1010),
        createFullReading('reading-3', new Date(2024, 0, 3), 1020),
      ];

      (SourceEnergyReadingModel.insertMany as jest.Mock).mockResolvedValue(expectedReadings);

      const result = await repository.createMany(readings);

      expect(connectDB).toHaveBeenCalled();
      expect(SourceEnergyReadingModel.insertMany).toHaveBeenCalledWith(readings);
      expect(result).toHaveLength(3);
      expect(result[0]._id).toBe('reading-1');
      expect(result[2]._id).toBe('reading-3');
    });

    it('should handle empty array', async () => {
      (SourceEnergyReadingModel.insertMany as jest.Mock).mockResolvedValue([]);

      const result = await repository.createMany([]);

      expect(result).toEqual([]);
      expect(SourceEnergyReadingModel.insertMany).toHaveBeenCalledWith([]);
    });

    it('should propagate error on bulk insert failure', async () => {
      const readings = [createReadingData(new Date(2024, 0, 1), 1000)];
      const dbError = new Error('Bulk insert failed');

      (SourceEnergyReadingModel.insertMany as jest.Mock).mockRejectedValue(dbError);

      await expect(repository.createMany(readings)).rejects.toThrow('Bulk insert failed');
    });
  });

  describe('findById', () => {
    it('should find reading by ID', async () => {
      const expectedReading = createFullReading('reading-1', new Date(2024, 0, 1), 1000);

      const mockExec = jest.fn().mockResolvedValue(expectedReading);
      const mockWhere = jest.fn().mockReturnValue({ exec: mockExec });
      (SourceEnergyReadingModel.findById as jest.Mock).mockReturnValue({
        where: mockWhere,
      });

      const result = await repository.findById('reading-1', mockUserId);

      expect(connectDB).toHaveBeenCalled();
      expect(SourceEnergyReadingModel.findById).toHaveBeenCalledWith('reading-1');
      expect(mockWhere).toHaveBeenCalledWith({ userId: mockUserId });
      expect(result).toEqual(expectedReading);
    });

    it('should return null when reading not found', async () => {
      const mockExec = jest.fn().mockResolvedValue(null);
      const mockWhere = jest.fn().mockReturnValue({ exec: mockExec });
      (SourceEnergyReadingModel.findById as jest.Mock).mockReturnValue({
        where: mockWhere,
      });

      const result = await repository.findById('nonexistent-id', mockUserId);

      expect(result).toBeNull();
    });

    it('should enforce user data isolation', async () => {
      const mockExec = jest.fn().mockResolvedValue(null);
      const mockWhere = jest.fn().mockReturnValue({ exec: mockExec });
      (SourceEnergyReadingModel.findById as jest.Mock).mockReturnValue({
        where: mockWhere,
      });

      await repository.findById('reading-1', 'different-user');

      expect(mockWhere).toHaveBeenCalledWith({ userId: 'different-user' });
    });
  });

  describe('findAll', () => {
    it('should find all readings for a user with no filters', async () => {
      const expectedReadings = [
        createFullReading('reading-1', new Date(2024, 0, 1), 1000),
        createFullReading('reading-2', new Date(2024, 0, 2), 1010),
      ];

      const mockExec = jest.fn().mockResolvedValue(expectedReadings);
      const mockSort = jest.fn().mockReturnValue({ exec: mockExec });
      const mockLimit = jest.fn().mockReturnValue({ sort: mockSort, exec: mockExec });
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit, sort: mockSort, exec: mockExec });
      const mockWhere = jest.fn().mockReturnValue({ skip: mockSkip, limit: mockLimit, sort: mockSort, exec: mockExec });
      (SourceEnergyReadingModel.find as jest.Mock).mockReturnValue({
        where: mockWhere,
        skip: mockSkip,
        limit: mockLimit,
        sort: mockSort,
        exec: mockExec,
      });

      const result = await repository.findAll(mockUserId);

      expect(connectDB).toHaveBeenCalled();
      expect(SourceEnergyReadingModel.find).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });

    it('should apply type filter when provided', async () => {
      const filters: EnergyFilters = { type: 'power' };
      const expectedReadings = [
        createFullReading('reading-1', new Date(2024, 0, 1), 1000, 'power'),
      ];

      const mockExec = jest.fn().mockResolvedValue(expectedReadings);
      const mockSort = jest.fn().mockReturnValue({ exec: mockExec });
      const mockLimit = jest.fn().mockReturnValue({ sort: mockSort, exec: mockExec });
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit, sort: mockSort, exec: mockExec });
      const mockWhere = jest.fn().mockReturnValue({ skip: mockSkip, limit: mockLimit, sort: mockSort, exec: mockExec });
      (SourceEnergyReadingModel.find as jest.Mock).mockReturnValue({
        where: mockWhere,
        skip: mockSkip,
        limit: mockLimit,
        sort: mockSort,
        exec: mockExec,
      });

      await repository.findAll(mockUserId, filters);

      expect(mockWhere).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'power' })
      );
    });

    it('should apply array type filter (multiple types)', async () => {
      const filters: EnergyFilters = { type: ['power', 'gas'] };

      const mockExec = jest.fn().mockResolvedValue([]);
      const mockSort = jest.fn().mockReturnValue({ exec: mockExec });
      const mockLimit = jest.fn().mockReturnValue({ sort: mockSort, exec: mockExec });
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit, sort: mockSort, exec: mockExec });
      const mockWhere = jest.fn().mockReturnValue({ skip: mockSkip, limit: mockLimit, sort: mockSort, exec: mockExec });
      (SourceEnergyReadingModel.find as jest.Mock).mockReturnValue({
        where: mockWhere,
        skip: mockSkip,
        limit: mockLimit,
        sort: mockSort,
        exec: mockExec,
      });

      await repository.findAll(mockUserId, filters);

      expect(mockWhere).toHaveBeenCalledWith(
        expect.objectContaining({ type: { $in: ['power', 'gas'] } })
      );
    });

    it('should apply date range filter', async () => {
      const filters: EnergyFilters = {
        dateRange: { start: new Date(2024, 0, 1), end: new Date(2024, 0, 31) },
      };

      const mockExec = jest.fn().mockResolvedValue([]);
      const mockSort = jest.fn().mockReturnValue({ exec: mockExec });
      const mockLimit = jest.fn().mockReturnValue({ sort: mockSort, exec: mockExec });
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit, sort: mockSort, exec: mockExec });
      const mockWhere = jest.fn().mockReturnValue({ skip: mockSkip, limit: mockLimit, sort: mockSort, exec: mockExec });
      (SourceEnergyReadingModel.find as jest.Mock).mockReturnValue({
        where: mockWhere,
        skip: mockSkip,
        limit: mockLimit,
        sort: mockSort,
        exec: mockExec,
      });

      await repository.findAll(mockUserId, filters);

      expect(mockWhere).toHaveBeenCalledWith(
        expect.objectContaining({
          date: { $gte: filters.dateRange!.start, $lte: filters.dateRange!.end },
        })
      );
    });

    it('should apply sorting', async () => {
      const filters: EnergyFilters = { sortBy: 'date', sortOrder: 'desc' };

      const mockExec = jest.fn().mockResolvedValue([]);
      const mockSort = jest.fn().mockReturnValue({ exec: mockExec });
      const mockLimit = jest.fn().mockReturnValue({ sort: mockSort, exec: mockExec });
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit, sort: mockSort, exec: mockExec });
      const mockWhere = jest.fn().mockReturnValue({ skip: mockSkip, limit: mockLimit, sort: mockSort, exec: mockExec });
      (SourceEnergyReadingModel.find as jest.Mock).mockReturnValue({
        where: mockWhere,
        skip: mockSkip,
        limit: mockLimit,
        sort: mockSort,
        exec: mockExec,
      });

      await repository.findAll(mockUserId, filters);

      expect(mockSort).toHaveBeenCalledWith({ date: -1 });
    });

    it('should apply pagination (limit and offset)', async () => {
      const filters: EnergyFilters = { limit: 10, offset: 20 };

      const mockExec = jest.fn().mockResolvedValue([]);
      const mockSort = jest.fn().mockReturnValue({ exec: mockExec });
      const mockLimit = jest.fn().mockReturnValue({ sort: mockSort, exec: mockExec });
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit, sort: mockSort, exec: mockExec });
      const mockWhere = jest.fn().mockReturnValue({ skip: mockSkip, limit: mockLimit, sort: mockSort, exec: mockExec });
      (SourceEnergyReadingModel.find as jest.Mock).mockReturnValue({
        where: mockWhere,
        skip: mockSkip,
        limit: mockLimit,
        sort: mockSort,
        exec: mockExec,
      });

      await repository.findAll(mockUserId, filters);

      expect(mockSkip).toHaveBeenCalledWith(20);
      expect(mockLimit).toHaveBeenCalledWith(10);
    });

    it('should return empty array when no readings found', async () => {
      const mockExec = jest.fn().mockResolvedValue([]);
      const mockSort = jest.fn().mockReturnValue({ exec: mockExec });
      const mockLimit = jest.fn().mockReturnValue({ sort: mockSort, exec: mockExec });
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit, sort: mockSort, exec: mockExec });
      const mockWhere = jest.fn().mockReturnValue({ skip: mockSkip, limit: mockLimit, sort: mockSort, exec: mockExec });
      (SourceEnergyReadingModel.find as jest.Mock).mockReturnValue({
        where: mockWhere,
        skip: mockSkip,
        limit: mockLimit,
        sort: mockSort,
        exec: mockExec,
      });

      const result = await repository.findAll(mockUserId);

      expect(result).toEqual([]);
    });
  });

  describe('findByDateRange', () => {
    it('should find readings within date range', async () => {
      const startDate = new Date(2024, 0, 1);
      const endDate = new Date(2024, 0, 31);
      const expectedReadings = [
        createFullReading('reading-1', new Date(2024, 0, 15), 1000),
      ];

      const mockExec = jest.fn().mockResolvedValue(expectedReadings);
      const mockSort = jest.fn().mockReturnValue({ exec: mockExec });
      const mockWhere = jest.fn().mockReturnValue({ sort: mockSort, exec: mockExec });
      (SourceEnergyReadingModel.find as jest.Mock).mockReturnValue({
        where: mockWhere,
        sort: mockSort,
        exec: mockExec,
      });

      const result = await repository.findByDateRange(mockUserId, startDate, endDate);

      expect(connectDB).toHaveBeenCalled();
      expect(mockWhere).toHaveBeenCalledWith(
        expect.objectContaining({
          date: { $gte: startDate, $lte: endDate },
        })
      );
      expect(result).toEqual(expectedReadings);
    });

    it('should filter by type when provided', async () => {
      const startDate = new Date(2024, 0, 1);
      const endDate = new Date(2024, 0, 31);

      const mockExec = jest.fn().mockResolvedValue([]);
      const mockSort = jest.fn().mockReturnValue({ exec: mockExec });
      const mockWhere = jest.fn().mockReturnValue({ sort: mockSort, exec: mockExec });
      (SourceEnergyReadingModel.find as jest.Mock).mockReturnValue({
        where: mockWhere,
        sort: mockSort,
        exec: mockExec,
      });

      await repository.findByDateRange(mockUserId, startDate, endDate, 'gas');

      expect(mockWhere).toHaveBeenCalledWith(
        expect.objectContaining({
          date: { $gte: startDate, $lte: endDate },
          type: 'gas',
        })
      );
    });

    it('should sort by date ascending', async () => {
      const startDate = new Date(2024, 0, 1);
      const endDate = new Date(2024, 0, 31);

      const mockExec = jest.fn().mockResolvedValue([]);
      const mockSort = jest.fn().mockReturnValue({ exec: mockExec });
      const mockWhere = jest.fn().mockReturnValue({ sort: mockSort, exec: mockExec });
      (SourceEnergyReadingModel.find as jest.Mock).mockReturnValue({
        where: mockWhere,
        sort: mockSort,
        exec: mockExec,
      });

      await repository.findByDateRange(mockUserId, startDate, endDate);

      expect(mockSort).toHaveBeenCalledWith({ date: 1 });
    });
  });

  describe('update', () => {
    it('should update an existing reading', async () => {
      const updateData = { amount: 1500 };
      const updatedReading = createFullReading('reading-1', new Date(2024, 0, 1), 1500);

      const mockExec = jest.fn().mockResolvedValue(updatedReading);
      const mockWhere = jest.fn().mockReturnValue({ exec: mockExec });
      (SourceEnergyReadingModel.findOneAndUpdate as jest.Mock).mockReturnValue({
        where: mockWhere,
        exec: mockExec,
      });

      const result = await repository.update('reading-1', mockUserId, updateData);

      expect(connectDB).toHaveBeenCalled();
      expect(SourceEnergyReadingModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: 'reading-1' },
        updateData,
        { new: true }
      );
      expect(mockWhere).toHaveBeenCalledWith({ userId: mockUserId });
      expect(result).toEqual(updatedReading);
      expect(result?.amount).toBe(1500);
    });

    it('should return null when reading not found', async () => {
      const updateData = { amount: 1500 };

      const mockExec = jest.fn().mockResolvedValue(null);
      const mockWhere = jest.fn().mockReturnValue({ exec: mockExec });
      (SourceEnergyReadingModel.findOneAndUpdate as jest.Mock).mockReturnValue({
        where: mockWhere,
        exec: mockExec,
      });

      const result = await repository.update('nonexistent-id', mockUserId, updateData);

      expect(result).toBeNull();
    });

    it('should enforce user data isolation', async () => {
      const updateData = { amount: 1500 };

      const mockExec = jest.fn().mockResolvedValue(null);
      const mockWhere = jest.fn().mockReturnValue({ exec: mockExec });
      (SourceEnergyReadingModel.findOneAndUpdate as jest.Mock).mockReturnValue({
        where: mockWhere,
        exec: mockExec,
      });

      await repository.update('reading-1', 'different-user', updateData);

      expect(mockWhere).toHaveBeenCalledWith({ userId: 'different-user' });
    });

    it('should allow updating multiple fields', async () => {
      const updateData = { amount: 1500, type: 'gas' as const, date: new Date(2024, 0, 2) };
      const updatedReading = createFullReading('reading-1', new Date(2024, 0, 2), 1500, 'gas');

      const mockExec = jest.fn().mockResolvedValue(updatedReading);
      const mockWhere = jest.fn().mockReturnValue({ exec: mockExec });
      (SourceEnergyReadingModel.findOneAndUpdate as jest.Mock).mockReturnValue({
        where: mockWhere,
        exec: mockExec,
      });

      const result = await repository.update('reading-1', mockUserId, updateData);

      expect(result?.amount).toBe(1500);
      expect(result?.type).toBe('gas');
    });
  });

  describe('delete', () => {
    it('should delete an existing reading', async () => {
      const mockExec = jest.fn().mockResolvedValue({ deletedCount: 1 });
      const mockWhere = jest.fn().mockReturnValue({ exec: mockExec });
      (SourceEnergyReadingModel.deleteOne as jest.Mock).mockReturnValue({
        where: mockWhere,
        exec: mockExec,
      });

      const result = await repository.delete('reading-1', mockUserId);

      expect(connectDB).toHaveBeenCalled();
      expect(SourceEnergyReadingModel.deleteOne).toHaveBeenCalledWith({ _id: 'reading-1' });
      expect(mockWhere).toHaveBeenCalledWith({ userId: mockUserId });
      expect(result).toBe(true);
    });

    it('should return false when reading not found', async () => {
      const mockExec = jest.fn().mockResolvedValue({ deletedCount: 0 });
      const mockWhere = jest.fn().mockReturnValue({ exec: mockExec });
      (SourceEnergyReadingModel.deleteOne as jest.Mock).mockReturnValue({
        where: mockWhere,
        exec: mockExec,
      });

      const result = await repository.delete('nonexistent-id', mockUserId);

      expect(result).toBe(false);
    });

    it('should enforce user data isolation', async () => {
      const mockExec = jest.fn().mockResolvedValue({ deletedCount: 0 });
      const mockWhere = jest.fn().mockReturnValue({ exec: mockExec });
      (SourceEnergyReadingModel.deleteOne as jest.Mock).mockReturnValue({
        where: mockWhere,
        exec: mockExec,
      });

      await repository.delete('reading-1', 'different-user');

      expect(mockWhere).toHaveBeenCalledWith({ userId: 'different-user' });
    });
  });

  describe('deleteMany', () => {
    it('should delete multiple readings', async () => {
      const ids = ['reading-1', 'reading-2', 'reading-3'];

      const mockExec = jest.fn().mockResolvedValue({ deletedCount: 3 });
      const mockWhere = jest.fn().mockReturnValue({ exec: mockExec });
      (SourceEnergyReadingModel.deleteMany as jest.Mock).mockReturnValue({
        where: mockWhere,
        exec: mockExec,
      });

      const result = await repository.deleteMany(ids, mockUserId);

      expect(connectDB).toHaveBeenCalled();
      expect(SourceEnergyReadingModel.deleteMany).toHaveBeenCalledWith({
        _id: { $in: ids },
      });
      expect(mockWhere).toHaveBeenCalledWith({ userId: mockUserId });
      expect(result).toBe(3);
    });

    it('should return 0 when no readings deleted', async () => {
      const ids = ['nonexistent-1', 'nonexistent-2'];

      const mockExec = jest.fn().mockResolvedValue({ deletedCount: 0 });
      const mockWhere = jest.fn().mockReturnValue({ exec: mockExec });
      (SourceEnergyReadingModel.deleteMany as jest.Mock).mockReturnValue({
        where: mockWhere,
        exec: mockExec,
      });

      const result = await repository.deleteMany(ids, mockUserId);

      expect(result).toBe(0);
    });

    it('should handle empty array', async () => {
      const mockExec = jest.fn().mockResolvedValue({ deletedCount: 0 });
      const mockWhere = jest.fn().mockReturnValue({ exec: mockExec });
      (SourceEnergyReadingModel.deleteMany as jest.Mock).mockReturnValue({
        where: mockWhere,
        exec: mockExec,
      });

      const result = await repository.deleteMany([], mockUserId);

      expect(result).toBe(0);
    });

    it('should enforce user data isolation', async () => {
      const ids = ['reading-1'];

      const mockExec = jest.fn().mockResolvedValue({ deletedCount: 0 });
      const mockWhere = jest.fn().mockReturnValue({ exec: mockExec });
      (SourceEnergyReadingModel.deleteMany as jest.Mock).mockReturnValue({
        where: mockWhere,
        exec: mockExec,
      });

      await repository.deleteMany(ids, 'different-user');

      expect(mockWhere).toHaveBeenCalledWith({ userId: 'different-user' });
    });
  });

  describe('count', () => {
    it('should count all readings for a user', async () => {
      const mockExec = jest.fn().mockResolvedValue(42);
      const mockWhere = jest.fn().mockReturnValue({ exec: mockExec });
      (SourceEnergyReadingModel.countDocuments as jest.Mock).mockReturnValue({
        where: mockWhere,
        exec: mockExec,
      });

      const result = await repository.count(mockUserId);

      expect(connectDB).toHaveBeenCalled();
      expect(SourceEnergyReadingModel.countDocuments).toHaveBeenCalled();
      expect(mockWhere).toHaveBeenCalled();
      expect(result).toBe(42);
    });

    it('should count with type filter', async () => {
      const filters: EnergyFilters = { type: 'power' };

      const mockExec = jest.fn().mockResolvedValue(20);
      const mockWhere = jest.fn().mockReturnValue({ exec: mockExec });
      (SourceEnergyReadingModel.countDocuments as jest.Mock).mockReturnValue({
        where: mockWhere,
        exec: mockExec,
      });

      const result = await repository.count(mockUserId, filters);

      expect(mockWhere).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'power' })
      );
      expect(result).toBe(20);
    });

    it('should return 0 when no readings exist', async () => {
      const mockExec = jest.fn().mockResolvedValue(0);
      const mockWhere = jest.fn().mockReturnValue({ exec: mockExec });
      (SourceEnergyReadingModel.countDocuments as jest.Mock).mockReturnValue({
        where: mockWhere,
        exec: mockExec,
      });

      const result = await repository.count(mockUserId);

      expect(result).toBe(0);
    });
  });

  describe('getMinMaxDates', () => {
    it('should return min and max dates for all readings', async () => {
      const mockMinReading = createFullReading('reading-1', new Date(2024, 0, 1), 1000);
      const mockMaxReading = createFullReading('reading-2', new Date(2024, 11, 31), 2000);

      const mockMinExec = jest.fn().mockResolvedValue(mockMinReading);
      const mockMaxExec = jest.fn().mockResolvedValue(mockMaxReading);
      const mockSort = jest.fn()
        .mockReturnValueOnce({ exec: mockMinExec })
        .mockReturnValueOnce({ exec: mockMaxExec });
      const mockWhere = jest.fn().mockReturnValue({ sort: mockSort });
      (SourceEnergyReadingModel.findOne as jest.Mock).mockReturnValue({
        where: mockWhere,
        sort: mockSort,
      });

      const result = await repository.getMinMaxDates(mockUserId);

      expect(connectDB).toHaveBeenCalled();
      expect(result).not.toBeNull();
      expect(result?.min).toEqual(new Date(2024, 0, 1));
      expect(result?.max).toEqual(new Date(2024, 11, 31));
    });

    it('should filter by type when provided', async () => {
      const mockMinReading = createFullReading('reading-1', new Date(2024, 0, 1), 1000, 'power');
      const mockMaxReading = createFullReading('reading-2', new Date(2024, 11, 31), 2000, 'power');

      const mockMinExec = jest.fn().mockResolvedValue(mockMinReading);
      const mockMaxExec = jest.fn().mockResolvedValue(mockMaxReading);
      const mockSort = jest.fn()
        .mockReturnValueOnce({ exec: mockMinExec })
        .mockReturnValueOnce({ exec: mockMaxExec });
      const mockWhere = jest.fn().mockReturnValue({ sort: mockSort });
      (SourceEnergyReadingModel.findOne as jest.Mock).mockReturnValue({
        where: mockWhere,
        sort: mockSort,
      });

      const result = await repository.getMinMaxDates(mockUserId, 'power');

      expect(mockWhere).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'power' })
      );
      expect(result).not.toBeNull();
    });

    it('should return null when no readings exist', async () => {
      const mockMinExec = jest.fn().mockResolvedValue(null);
      const mockMaxExec = jest.fn().mockResolvedValue(null);
      const mockSort = jest.fn()
        .mockReturnValueOnce({ exec: mockMinExec })
        .mockReturnValueOnce({ exec: mockMaxExec });
      const mockWhere = jest.fn().mockReturnValue({ sort: mockSort });
      (SourceEnergyReadingModel.findOne as jest.Mock).mockReturnValue({
        where: mockWhere,
        sort: mockSort,
      });

      const result = await repository.getMinMaxDates(mockUserId);

      expect(result).toBeNull();
    });

    it('should enforce user data isolation', async () => {
      const mockMinExec = jest.fn().mockResolvedValue(null);
      const mockMaxExec = jest.fn().mockResolvedValue(null);
      const mockSort = jest.fn()
        .mockReturnValueOnce({ exec: mockMinExec })
        .mockReturnValueOnce({ exec: mockMaxExec });
      const mockWhere = jest.fn().mockReturnValue({ sort: mockSort });
      (SourceEnergyReadingModel.findOne as jest.Mock).mockReturnValue({
        where: mockWhere,
        sort: mockSort,
      });

      await repository.getMinMaxDates('different-user');

      expect(mockWhere).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'different-user' })
      );
    });
  });
});
