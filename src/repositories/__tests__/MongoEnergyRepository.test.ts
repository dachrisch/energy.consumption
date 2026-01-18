/**
 * Tests for MongoEnergyRepository
 * Following TDD: Write tests first, then implement
 */

// Mock dependencies BEFORE imports
jest.mock('@/lib/mongodb', () => ({
  connectDB: jest.fn().mockResolvedValue(undefined),
}));

const mockSourceEnergyReading = {
  find: jest.fn(),
  findById: jest.fn(),
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
  deleteOne: jest.fn(),
  deleteMany: jest.fn(),
  countDocuments: jest.fn(),
  insertMany: jest.fn(),
};

// Mock constructor
const MockSourceEnergyReading: any = jest.fn().mockImplementation(() => ({
  save: jest.fn(),
}));

// Attach static methods
Object.assign(MockSourceEnergyReading, mockSourceEnergyReading);

jest.mock('@/models/SourceEnergyReading', () => ({
  __esModule: true,
  default: MockSourceEnergyReading,
  SourceEnergyReading: MockSourceEnergyReading,
}));

import { MongoEnergyRepository } from '../mongodb/MongoEnergyRepository';
import { SourceEnergyReading, EnergyFilters } from '@/app/types';
import { connectDB } from '@/lib/mongodb';
import MockModel from '@/models/SourceEnergyReading';

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
    unit: 'kWh',
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
    unit: 'kWh',
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
      (MockModel as unknown as jest.Mock).mockImplementation(() => ({
        save: mockSave,
      }));

      const result = await repository.create(readingData);

      expect(connectDB).toHaveBeenCalled();
      expect(mockSave).toHaveBeenCalled();
      expect(result).toEqual(expectedReading);
    });

    it('should propagate error on database failure', async () => {
      const readingData = createReadingData(new Date(2024, 0, 1), 1000);
      const dbError = new Error('Database connection failed');

      const mockSave = jest.fn().mockRejectedValue(dbError);
      (MockModel as unknown as jest.Mock).mockImplementation(() => ({
        save: mockSave,
      }));

      await expect(repository.create(readingData)).rejects.toThrow('Database connection failed');
    });
  });

  describe('createMany', () => {
    it('should create multiple readings in bulk', async () => {
      const readings = [
        createReadingData(new Date(2024, 0, 1), 1000),
        createReadingData(new Date(2024, 0, 2), 1010),
      ];

      const expectedReadings = [
        createFullReading('reading-1', new Date(2024, 0, 1), 1000),
        createFullReading('reading-2', new Date(2024, 0, 2), 1010),
      ];

      (MockModel.insertMany as jest.Mock).mockResolvedValue(expectedReadings);

      const result = await repository.createMany(readings);

      expect(connectDB).toHaveBeenCalled();
      expect(MockModel.insertMany).toHaveBeenCalledWith(readings);
      expect(result).toHaveLength(2);
    });
  });

  describe('findById', () => {
    it('should find reading by ID', async () => {
      const expectedReading = createFullReading('reading-1', new Date(2024, 0, 1), 1000);

      const mockExec = jest.fn().mockResolvedValue(expectedReading);
      const mockWhere = jest.fn().mockReturnValue({ exec: mockExec });
      (MockModel.findById as jest.Mock).mockReturnValue({
        where: mockWhere,
      });

      const result = await repository.findById('reading-1', mockUserId);

      expect(MockModel.findById).toHaveBeenCalledWith('reading-1');
      expect(mockWhere).toHaveBeenCalledWith({ userId: mockUserId });
      expect(result).toEqual(expectedReading);
    });
  });

  describe('findAll', () => {
    it('should find all readings for a user with no filters', async () => {
      const expectedReadings = [
        createFullReading('reading-1', new Date(2024, 0, 1), 1000),
      ];

      const mockExec = jest.fn().mockResolvedValue(expectedReadings);
      const mockSort = jest.fn().mockReturnValue({ exec: mockExec });
      const mockLimit = jest.fn().mockReturnValue({ sort: mockSort, exec: mockExec });
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit, sort: mockSort, exec: mockExec });
      const mockWhere = jest.fn().mockReturnValue({ skip: mockSkip, limit: mockLimit, sort: mockSort, exec: mockExec });
      
      (MockModel.find as jest.Mock).mockReturnValue({
        where: mockWhere,
      });

      const result = await repository.findAll(mockUserId);

      expect(MockModel.find).toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });
  });

  describe('findByDateRange', () => {
    it('should find readings within date range', async () => {
      const startDate = new Date(2024, 0, 1);
      const endDate = new Date(2024, 0, 31);
      const expectedReadings = [createFullReading('r1', new Date(2024, 0, 15), 1000)];

      const mockExec = jest.fn().mockResolvedValue(expectedReadings);
      const mockSort = jest.fn().mockReturnValue({ exec: mockExec });
      const mockWhere = jest.fn().mockReturnValue({ sort: mockSort });
      
      (MockModel.find as jest.Mock).mockReturnValue({
        where: mockWhere,
      });

      const result = await repository.findByDateRange(mockUserId, startDate, endDate);

      expect(mockWhere).toHaveBeenCalledWith(
        expect.objectContaining({
          date: { $gte: startDate, $lte: endDate },
        })
      );
      expect(result).toEqual(expectedReadings);
    });
  });

  describe('update', () => {
    it('should update an existing reading', async () => {
      const updateData = { amount: 1500 };
      const updatedReading = createFullReading('reading-1', new Date(2024, 0, 1), 1500);

      const mockExec = jest.fn().mockResolvedValue(updatedReading);
      const mockWhere = jest.fn().mockReturnValue({ exec: mockExec });
      (MockModel.findOneAndUpdate as jest.Mock).mockReturnValue({
        where: mockWhere,
      });

      const result = await repository.update('reading-1', mockUserId, updateData);

      expect(MockModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: 'reading-1' },
        updateData,
        { new: true }
      );
      expect(result).toEqual(updatedReading);
    });
  });

  describe('delete', () => {
    it('should delete an existing reading', async () => {
      const mockExec = jest.fn().mockResolvedValue({ deletedCount: 1 });
      const mockWhere = jest.fn().mockReturnValue({ exec: mockExec });
      (MockModel.deleteOne as jest.Mock).mockReturnValue({
        where: mockWhere,
      });

      const result = await repository.delete('reading-1', mockUserId);

      expect(MockModel.deleteOne).toHaveBeenCalledWith({ _id: 'reading-1' });
      expect(result).toBe(true);
    });
  });

  describe('count', () => {
    it('should count all readings for a user', async () => {
      const mockExec = jest.fn().mockResolvedValue(42);
      const mockWhere = jest.fn().mockReturnValue({ exec: mockExec });
      (MockModel.countDocuments as jest.Mock).mockReturnValue({
        where: mockWhere,
      });

      const result = await repository.count(mockUserId);

      expect(MockModel.countDocuments).toHaveBeenCalled();
      expect(result).toBe(42);
    });
  });

  describe('getMinMaxDates', () => {
    it('should return min and max dates for all readings', async () => {
      const mockMinReading = createFullReading('r1', new Date(2024, 0, 1), 1000);
      const mockMaxReading = createFullReading('r2', new Date(2024, 11, 31), 2000);

      const mockMinExec = jest.fn().mockResolvedValue(mockMinReading);
      const mockMaxExec = jest.fn().mockResolvedValue(mockMaxReading);
      const mockSort = jest.fn()
        .mockReturnValueOnce({ exec: mockMinExec })
        .mockReturnValueOnce({ exec: mockMaxExec });
      const mockWhere = jest.fn().mockReturnValue({ sort: mockSort });
      
      (MockModel.findOne as jest.Mock).mockReturnValue({
        where: mockWhere,
      });

      const result = await repository.getMinMaxDates(mockUserId);

      expect(result?.min).toEqual(new Date(2024, 0, 1));
      expect(result?.max).toEqual(new Date(2024, 11, 31));
    });
  });
});