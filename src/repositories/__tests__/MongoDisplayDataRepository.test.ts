/**
 * Tests for MongoDisplayDataRepository
 */

// Mock dependencies BEFORE imports
jest.mock('@/lib/mongodb', () => ({
  connectDB: jest.fn().mockResolvedValue(undefined),
}));

const mockDisplayEnergyData = {
  find: jest.fn(),
  findById: jest.fn(),
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
  deleteOne: jest.fn(),
  deleteMany: jest.fn(),
};

// Mock constructor
const MockDisplayEnergyData: any = jest.fn().mockImplementation(() => ({
  save: jest.fn(),
}));

// Attach static methods
Object.assign(MockDisplayEnergyData, mockDisplayEnergyData);

jest.mock('@/models/DisplayEnergyData', () => ({
  __esModule: true,
  default: MockDisplayEnergyData,
  DisplayEnergyData: MockDisplayEnergyData,
}));

import { MongoDisplayDataRepository } from '../mongodb/MongoDisplayDataRepository';
import { DisplayEnergyData, DisplayDataType } from '@/app/types';
import { connectDB } from '@/lib/mongodb';
import MockModel from '@/models/DisplayEnergyData';

describe('MongoDisplayDataRepository', () => {
  let repository: MongoDisplayDataRepository;
  const mockUserId = 'test-user-123';

  beforeEach(() => {
    repository = new MongoDisplayDataRepository();
    jest.clearAllMocks();
    (connectDB as jest.Mock).mockResolvedValue(undefined);
  });

  describe('upsert', () => {
    it('should update existing display data', async () => {
      const displayData: Omit<DisplayEnergyData, '_id'> = {
        userId: mockUserId,
        displayType: 'monthly-chart-power',
        data: { some: 'data' },
        calculatedAt: new Date(),
        sourceDataHash: 'hash123',
      };

      const mockExec = jest.fn().mockResolvedValue(displayData);
      const mockWhere = jest.fn().mockReturnValue({ exec: mockExec });
      (MockModel.findOneAndUpdate as jest.Mock).mockReturnValue({
        where: mockWhere,
      });

      const result = await repository.upsert(displayData);

      expect(MockModel.findOneAndUpdate).toHaveBeenCalled();
      expect(result).toEqual(displayData);
    });
  });

  describe('findByType', () => {
    it('should find display data by type', async () => {
      const mockExec = jest.fn().mockResolvedValue({ userId: mockUserId });
      (MockModel.findOne as jest.Mock).mockReturnValue({
        exec: mockExec,
      });

      const result = await repository.findByType(mockUserId, 'monthly-chart-power');

      expect(MockModel.findOne).toHaveBeenCalled();
      expect(result).not.toBeNull();
    });
  });

  describe('invalidateForUser', () => {
    it('should invalidate all display data for a user', async () => {
      const mockExec = jest.fn().mockResolvedValue({ deletedCount: 5 });
      const mockWhere = jest.fn().mockReturnValue({ exec: mockExec });
      (MockModel.deleteMany as jest.Mock).mockReturnValue({
        where: mockWhere,
      });

      await repository.invalidateForUser(mockUserId);

      expect(MockModel.deleteMany).toHaveBeenCalledWith({ userId: mockUserId });
      expect(mockWhere).toHaveBeenCalledWith({ userId: mockUserId });
    });
  });
});