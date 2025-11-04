/**
 * Tests for DataAggregationService
 * Following TDD: Write tests first, then implement
 */

import {
  aggregateDataIntoBuckets,
  calculateBucketCount,
  createEmptyBuckets,
  getDataDateRange,
} from '../DataAggregationService';
import { EnergyType } from '@/app/types';

describe('DataAggregationService', () => {
  // Sample test data
  const sampleData: EnergyType[] = [
    {
      _id: '1',
      type: 'power',
      amount: 100,
      date: new Date('2024-10-01'),
      userId: 'user1',
    },
    {
      _id: '2',
      type: 'gas',
      amount: 50,
      date: new Date('2024-10-05'),
      userId: 'user1',
    },
    {
      _id: '3',
      type: 'power',
      amount: 150,
      date: new Date('2024-10-10'),
      userId: 'user1',
    },
    {
      _id: '4',
      type: 'gas',
      amount: 75,
      date: new Date('2024-10-15'),
      userId: 'user1',
    },
    {
      _id: '5',
      type: 'power',
      amount: 200,
      date: new Date('2024-10-20'),
      userId: 'user1',
    },
  ];

  describe('getDataDateRange', () => {
    it('should return min and max dates from dataset', () => {
      const result = getDataDateRange(sampleData);

      expect(result.min).toEqual(new Date('2024-10-01'));
      expect(result.max).toEqual(new Date('2024-10-20'));
    });

    it('should handle single data point', () => {
      const singleData = [sampleData[0]];
      const result = getDataDateRange(singleData);

      expect(result.min).toEqual(new Date('2024-10-01'));
      expect(result.max).toEqual(new Date('2024-10-01'));
    });

    it('should handle empty dataset', () => {
      const result = getDataDateRange([]);

      expect(result.min).toBeNull();
      expect(result.max).toBeNull();
    });

    it('should handle dates in any order', () => {
      const unorderedData = [sampleData[4], sampleData[0], sampleData[2]];
      const result = getDataDateRange(unorderedData);

      expect(result.min).toEqual(new Date('2024-10-01'));
      expect(result.max).toEqual(new Date('2024-10-20'));
    });
  });

  describe('calculateBucketCount', () => {
    it('should return mobile bucket count for small screens', () => {
      const result = calculateBucketCount(500); // Mobile width

      expect(result).toBeGreaterThanOrEqual(20);
      expect(result).toBeLessThanOrEqual(30);
    });

    it('should return desktop bucket count for large screens', () => {
      const result = calculateBucketCount(1200); // Desktop width

      expect(result).toBeGreaterThanOrEqual(60);
      expect(result).toBeLessThanOrEqual(100);
    });

    it('should scale with width', () => {
      const small = calculateBucketCount(400);
      const large = calculateBucketCount(1600);

      expect(large).toBeGreaterThan(small);
    });

    it('should never return less than minimum', () => {
      const result = calculateBucketCount(100); // Very small width

      expect(result).toBeGreaterThanOrEqual(10);
    });
  });

  describe('createEmptyBuckets', () => {
    it('should create correct number of buckets', () => {
      const start = new Date('2024-10-01');
      const end = new Date('2024-10-31');
      const bucketCount = 30;

      const result = createEmptyBuckets(start, end, bucketCount);

      expect(result).toHaveLength(bucketCount);
    });

    it('should create buckets with correct structure', () => {
      const start = new Date('2024-10-01');
      const end = new Date('2024-10-10');
      const bucketCount = 10;

      const result = createEmptyBuckets(start, end, bucketCount);

      result.forEach((bucket) => {
        expect(bucket).toHaveProperty('startDate');
        expect(bucket).toHaveProperty('endDate');
        expect(bucket).toHaveProperty('count');
        expect(bucket.startDate).toBeInstanceOf(Date);
        expect(bucket.endDate).toBeInstanceOf(Date);
        expect(bucket.count).toBe(0);
      });
    });

    it('should create sequential buckets', () => {
      const start = new Date('2024-10-01');
      const end = new Date('2024-10-10');
      const bucketCount = 5;

      const result = createEmptyBuckets(start, end, bucketCount);

      for (let i = 0; i < result.length - 1; i++) {
        expect(result[i].endDate.getTime()).toBeLessThanOrEqual(
          result[i + 1].startDate.getTime()
        );
      }
    });

    it('should cover full date range', () => {
      const start = new Date('2024-10-01');
      const end = new Date('2024-10-31');
      const bucketCount = 10;

      const result = createEmptyBuckets(start, end, bucketCount);

      expect(result[0].startDate.getTime()).toBeLessThanOrEqual(start.getTime());
      expect(result[result.length - 1].endDate.getTime()).toBeGreaterThanOrEqual(end.getTime());
    });
  });

  describe('aggregateDataIntoBuckets', () => {
    it('should aggregate data into buckets correctly', () => {
      const start = new Date('2024-10-01');
      const end = new Date('2024-10-31');
      const bucketCount = 5;

      const result = aggregateDataIntoBuckets(sampleData, start, end, bucketCount);

      expect(result).toHaveLength(bucketCount);

      // Total count should equal data length
      const totalCount = result.reduce((sum, bucket) => sum + bucket.count, 0);
      expect(totalCount).toBe(sampleData.length);
    });

    it('should count measurements regardless of type (single color histogram)', () => {
      const start = new Date('2024-10-01');
      const end = new Date('2024-10-31');
      const bucketCount = 10;

      const result = aggregateDataIntoBuckets(sampleData, start, end, bucketCount);

      // Each measurement should be counted once, not split by type
      const totalCount = result.reduce((sum, bucket) => sum + bucket.count, 0);
      expect(totalCount).toBe(5); // Total measurements
    });

    it('should handle data outside range', () => {
      const start = new Date('2024-10-05');
      const end = new Date('2024-10-15');
      const bucketCount = 5;

      const result = aggregateDataIntoBuckets(sampleData, start, end, bucketCount);

      // Should only count data within range
      const totalCount = result.reduce((sum, bucket) => sum + bucket.count, 0);
      expect(totalCount).toBeLessThan(sampleData.length);
    });

    it('should handle empty dataset', () => {
      const start = new Date('2024-10-01');
      const end = new Date('2024-10-31');
      const bucketCount = 10;

      const result = aggregateDataIntoBuckets([], start, end, bucketCount);

      expect(result).toHaveLength(bucketCount);
      result.forEach((bucket) => {
        expect(bucket.count).toBe(0);
      });
    });

    it('should handle single bucket', () => {
      const start = new Date('2024-10-01');
      const end = new Date('2024-10-31');
      const bucketCount = 1;

      const result = aggregateDataIntoBuckets(sampleData, start, end, bucketCount);

      expect(result).toHaveLength(1);
      expect(result[0].count).toBe(sampleData.length);
    });

    it('should distribute data across multiple buckets', () => {
      const start = new Date('2024-10-01');
      const end = new Date('2024-10-31');
      const bucketCount = 10;

      const result = aggregateDataIntoBuckets(sampleData, start, end, bucketCount);

      // At least some buckets should have data
      const bucketsWithData = result.filter((b) => b.count > 0);
      expect(bucketsWithData.length).toBeGreaterThan(0);
    });

    it('should be performant with large datasets', () => {
      // Create 1000 measurements
      const largeData: EnergyType[] = Array.from({ length: 1000 }, (_, i) => ({
        _id: `${i}`,
        type: i % 2 === 0 ? 'power' : 'gas',
        amount: 100 + i,
        date: new Date(2024, 0, 1 + Math.floor(i / 3)), // Spread over ~333 days
        userId: 'user1',
      }));

      const start = new Date('2024-01-01');
      const end = new Date('2024-12-31');
      const bucketCount = 100;

      const startTime = performance.now();
      const result = aggregateDataIntoBuckets(largeData, start, end, bucketCount);
      const endTime = performance.now();

      expect(result).toHaveLength(bucketCount);
      expect(endTime - startTime).toBeLessThan(100); // Should be < 100ms
    });
  });
});
