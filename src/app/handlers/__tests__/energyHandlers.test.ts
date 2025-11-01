import { getLatestValues, getFilteredAndSortedData } from '../energyHandlers';
import { EnergyData, EnergyOptions, EnergySortField } from '../../types';
import { SortOrder } from 'mongoose';

describe('energyHandlers', () => {
  describe('getLatestValues', () => {
    it('should return 0 for both power and gas when data is empty', () => {
      const energyData: EnergyData = [];

      const result = getLatestValues(energyData);

      expect(result.power).toBe(0);
      expect(result.gas).toBe(0);
    });

    it('should return latest power value', () => {
      const energyData: EnergyData = [
        {
          _id: '1',
          userId: 'user1',
          type: 'power' as EnergyOptions,
          amount: 1000,
          date: new Date('2024-01-01'),
        },
        {
          _id: '2',
          userId: 'user1',
          type: 'power' as EnergyOptions,
          amount: 1500,
          date: new Date('2024-01-05'),
        },
        {
          _id: '3',
          userId: 'user1',
          type: 'power' as EnergyOptions,
          amount: 1200,
          date: new Date('2024-01-03'),
        },
      ];

      const result = getLatestValues(energyData);

      expect(result.power).toBe(1500);
      expect(result.gas).toBe(0);
    });

    it('should return latest gas value', () => {
      const energyData: EnergyData = [
        {
          _id: '1',
          userId: 'user1',
          type: 'gas' as EnergyOptions,
          amount: 500,
          date: new Date('2024-01-01'),
        },
        {
          _id: '2',
          userId: 'user1',
          type: 'gas' as EnergyOptions,
          amount: 750,
          date: new Date('2024-01-05'),
        },
        {
          _id: '3',
          userId: 'user1',
          type: 'gas' as EnergyOptions,
          amount: 600,
          date: new Date('2024-01-03'),
        },
      ];

      const result = getLatestValues(energyData);

      expect(result.power).toBe(0);
      expect(result.gas).toBe(750);
    });

    it('should return latest values for both power and gas', () => {
      const energyData: EnergyData = [
        {
          _id: '1',
          userId: 'user1',
          type: 'power' as EnergyOptions,
          amount: 1000,
          date: new Date('2024-01-01'),
        },
        {
          _id: '2',
          userId: 'user1',
          type: 'power' as EnergyOptions,
          amount: 1500,
          date: new Date('2024-01-05'),
        },
        {
          _id: '3',
          userId: 'user1',
          type: 'gas' as EnergyOptions,
          amount: 500,
          date: new Date('2024-01-02'),
        },
        {
          _id: '4',
          userId: 'user1',
          type: 'gas' as EnergyOptions,
          amount: 750,
          date: new Date('2024-01-06'),
        },
      ];

      const result = getLatestValues(energyData);

      expect(result.power).toBe(1500);
      expect(result.gas).toBe(750);
    });

    it('should handle single power entry', () => {
      const energyData: EnergyData = [
        {
          _id: '1',
          userId: 'user1',
          type: 'power' as EnergyOptions,
          amount: 1000,
          date: new Date('2024-01-01'),
        },
      ];

      const result = getLatestValues(energyData);

      expect(result.power).toBe(1000);
      expect(result.gas).toBe(0);
    });

    it('should handle single gas entry', () => {
      const energyData: EnergyData = [
        {
          _id: '1',
          userId: 'user1',
          type: 'gas' as EnergyOptions,
          amount: 500,
          date: new Date('2024-01-01'),
        },
      ];

      const result = getLatestValues(energyData);

      expect(result.power).toBe(0);
      expect(result.gas).toBe(500);
    });
  });

  describe('getFilteredAndSortedData', () => {
    const sampleData: EnergyData = [
      {
        _id: '1',
        userId: 'user1',
        type: 'power' as EnergyOptions,
        amount: 1000,
        date: new Date('2024-01-01'),
      },
      {
        _id: '2',
        userId: 'user1',
        type: 'gas' as EnergyOptions,
        amount: 500,
        date: new Date('2024-01-02'),
      },
      {
        _id: '3',
        userId: 'user1',
        type: 'power' as EnergyOptions,
        amount: 1500,
        date: new Date('2024-01-03'),
      },
      {
        _id: '4',
        userId: 'user1',
        type: 'gas' as EnergyOptions,
        amount: 750,
        date: new Date('2024-01-04'),
      },
    ];

    it('should return all data when no filters applied', () => {
      const result = getFilteredAndSortedData(
        sampleData,
        'all',
        { start: null, end: null },
        'date',
        'asc'
      );

      expect(result).toHaveLength(4);
    });

    it('should filter by power type', () => {
      const result = getFilteredAndSortedData(
        sampleData,
        'power',
        { start: null, end: null },
        'date',
        'asc'
      );

      expect(result).toHaveLength(2);
      expect(result.every(item => item.type === 'power')).toBe(true);
    });

    it('should filter by gas type', () => {
      const result = getFilteredAndSortedData(
        sampleData,
        'gas',
        { start: null, end: null },
        'date',
        'asc'
      );

      expect(result).toHaveLength(2);
      expect(result.every(item => item.type === 'gas')).toBe(true);
    });

    it('should filter by start date', () => {
      const result = getFilteredAndSortedData(
        sampleData,
        'all',
        { start: new Date('2024-01-03'), end: null },
        'date',
        'asc'
      );

      expect(result).toHaveLength(2);
      expect(result[0]._id).toBe('3');
      expect(result[1]._id).toBe('4');
    });

    it('should filter by end date', () => {
      const result = getFilteredAndSortedData(
        sampleData,
        'all',
        { start: null, end: new Date('2024-01-02') },
        'date',
        'asc'
      );

      expect(result).toHaveLength(2);
      expect(result[0]._id).toBe('1');
      expect(result[1]._id).toBe('2');
    });

    it('should filter by date range', () => {
      const result = getFilteredAndSortedData(
        sampleData,
        'all',
        { start: new Date('2024-01-02'), end: new Date('2024-01-03') },
        'date',
        'asc'
      );

      expect(result).toHaveLength(2);
      expect(result[0]._id).toBe('2');
      expect(result[1]._id).toBe('3');
    });

    it('should sort by date ascending', () => {
      const result = getFilteredAndSortedData(
        sampleData,
        'all',
        { start: null, end: null },
        'date',
        'asc'
      );

      expect(result[0]._id).toBe('1');
      expect(result[1]._id).toBe('2');
      expect(result[2]._id).toBe('3');
      expect(result[3]._id).toBe('4');
    });

    it('should sort by date descending', () => {
      const result = getFilteredAndSortedData(
        sampleData,
        'all',
        { start: null, end: null },
        'date',
        'desc'
      );

      expect(result[0]._id).toBe('4');
      expect(result[1]._id).toBe('3');
      expect(result[2]._id).toBe('2');
      expect(result[3]._id).toBe('1');
    });

    it('should sort by type ascending', () => {
      const result = getFilteredAndSortedData(
        sampleData,
        'all',
        { start: null, end: null },
        'type',
        'asc'
      );

      expect(result[0].type).toBe('gas');
      expect(result[1].type).toBe('gas');
      expect(result[2].type).toBe('power');
      expect(result[3].type).toBe('power');
    });

    it('should sort by type descending', () => {
      const result = getFilteredAndSortedData(
        sampleData,
        'all',
        { start: null, end: null },
        'type',
        'desc'
      );

      expect(result[0].type).toBe('power');
      expect(result[1].type).toBe('power');
      expect(result[2].type).toBe('gas');
      expect(result[3].type).toBe('gas');
    });

    it('should sort by amount ascending', () => {
      const result = getFilteredAndSortedData(
        sampleData,
        'all',
        { start: null, end: null },
        'amount',
        'asc'
      );

      expect(result[0].amount).toBe(500);
      expect(result[1].amount).toBe(750);
      expect(result[2].amount).toBe(1000);
      expect(result[3].amount).toBe(1500);
    });

    it('should sort by amount descending', () => {
      const result = getFilteredAndSortedData(
        sampleData,
        'all',
        { start: null, end: null },
        'amount',
        'desc'
      );

      expect(result[0].amount).toBe(1500);
      expect(result[1].amount).toBe(1000);
      expect(result[2].amount).toBe(750);
      expect(result[3].amount).toBe(500);
    });

    it('should combine type filter and date range', () => {
      const result = getFilteredAndSortedData(
        sampleData,
        'power',
        { start: new Date('2024-01-02'), end: new Date('2024-01-04') },
        'date',
        'asc'
      );

      expect(result).toHaveLength(1);
      expect(result[0]._id).toBe('3');
      expect(result[0].type).toBe('power');
    });

    it('should combine type filter and sorting', () => {
      const result = getFilteredAndSortedData(
        sampleData,
        'power',
        { start: null, end: null },
        'amount',
        'desc'
      );

      expect(result).toHaveLength(2);
      expect(result[0].amount).toBe(1500);
      expect(result[1].amount).toBe(1000);
    });

    it('should not mutate original data', () => {
      const originalData = [...sampleData];

      getFilteredAndSortedData(
        sampleData,
        'power',
        { start: null, end: null },
        'amount',
        'desc'
      );

      expect(sampleData).toEqual(originalData);
    });

    it('should handle empty data', () => {
      const result = getFilteredAndSortedData(
        [],
        'all',
        { start: null, end: null },
        'date',
        'asc'
      );

      expect(result).toEqual([]);
    });

    it('should handle date range with no matches', () => {
      const result = getFilteredAndSortedData(
        sampleData,
        'all',
        { start: new Date('2025-01-01'), end: new Date('2025-12-31') },
        'date',
        'asc'
      );

      expect(result).toEqual([]);
    });
  });
});
