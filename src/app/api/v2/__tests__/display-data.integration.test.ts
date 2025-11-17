/**
 * /api/v2/display-data Integration Tests
 *
 * Tests the display data cache API with:
 * - Real service layer integration
 * - Cache hit/miss tracking
 * - Automatic cache invalidation
 * - Performance verification
 */

import { NextRequest } from 'next/server';
import { POST, DELETE } from '../display-data/route';
import { connectDB } from '@/lib/mongodb';
import { getEnergyCrudService, getDisplayDataService, resetServices, initializeEventHandlers } from '@/services';
import { resetEventBus } from '@/events';
import SourceEnergyReading from '@/models/SourceEnergyReading';
import DisplayEnergyData from '@/models/DisplayEnergyData';

// Mock NextAuth session
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(() =>
    Promise.resolve({
      user: { id: 'test-user-display', email: 'test@example.com' },
    })
  ),
}));

jest.setTimeout(30000);

describe('/api/v2/display-data Integration Tests', () => {
  const testUserId = 'test-user-display';

  beforeAll(async () => {
    await connectDB();
    initializeEventHandlers(); // Enable auto-invalidation
  });

  beforeEach(async () => {
    // Clean up test data
    await SourceEnergyReading.deleteMany({ userId: testUserId });
    await DisplayEnergyData.deleteMany({ userId: testUserId });
    resetServices();
  });

  afterEach(async () => {
    await SourceEnergyReading.deleteMany({ userId: testUserId });
    await DisplayEnergyData.deleteMany({ userId: testUserId });
  });

  describe('POST /api/v2/display-data (Monthly Chart)', () => {
    beforeEach(async () => {
      // Create test source data
      const service = getEnergyCrudService();
      await service.createMany([
        { userId: testUserId, type: 'power', date: new Date('2024-01-15'), amount: 10000 },
        { userId: testUserId, type: 'power', date: new Date('2024-02-15'), amount: 10150 },
        { userId: testUserId, type: 'power', date: new Date('2024-03-15'), amount: 10300 },
      ]);
    });

    it('should calculate and cache monthly chart data', async () => {
      const request = new NextRequest('http://localhost:3000/api/v2/display-data', {
        method: 'POST',
        body: JSON.stringify({
          displayType: 'monthly-chart',
          filters: {
            type: 'power',
            year: 2024,
          },
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.months).toHaveLength(12);
      expect(data.cacheHit).toBe(false); // First request - cache miss
      expect(data.meta.backend).toBe('new');
    });

    it('should return cached data on subsequent requests (cache hit)', async () => {
      const requestBody = JSON.stringify({
        displayType: 'monthly-chart',
        filters: { type: 'power', year: 2024 },
      });

      // First request - calculates and caches
      const request1 = new NextRequest('http://localhost:3000/api/v2/display-data', {
        method: 'POST',
        body: requestBody,
      });
      const response1 = await POST(request1);
      const data1 = await response1.json();
      expect(data1.cacheHit).toBe(false);

      // Second request - should hit cache
      const request2 = new NextRequest('http://localhost:3000/api/v2/display-data', {
        method: 'POST',
        body: requestBody,
      });
      const response2 = await POST(request2);
      const data2 = await response2.json();
      expect(data2.cacheHit).toBe(true); // Cache hit!

      // Data should be identical
      expect(data2.data.sourceDataHash).toBe(data1.data.sourceDataHash);
    });

    it('should invalidate cache when source data changes', async () => {
      const requestBody = JSON.stringify({
        displayType: 'monthly-chart',
        filters: { type: 'power', year: 2024 },
      });

      // First request - cache miss
      const request1 = new NextRequest('http://localhost:3000/api/v2/display-data', {
        method: 'POST',
        body: requestBody,
      });
      await POST(request1);

      // Add new reading (triggers cache invalidation via event)
      const service = getEnergyCrudService();
      await service.create({
        userId: testUserId,
        type: 'power',
        date: new Date('2024-04-15'),
        amount: 10450,
      });

      // Wait for event processing
      await new Promise(resolve => setTimeout(resolve, 300));

      // Third request - cache should be invalidated, new calculation
      const request3 = new NextRequest('http://localhost:3000/api/v2/display-data', {
        method: 'POST',
        body: requestBody,
      });
      const response3 = await POST(request3);
      const data3 = await response3.json();

      expect(data3.cacheHit).toBe(false); // Cache invalidated, recalculated
    });
  });

  describe('POST /api/v2/display-data (Histogram)', () => {
    beforeEach(async () => {
      const service = getEnergyCrudService();
      await service.createMany([
        { userId: testUserId, type: 'gas', date: new Date('2024-01-01'), amount: 500 },
        { userId: testUserId, type: 'gas', date: new Date('2024-06-01'), amount: 550 },
        { userId: testUserId, type: 'gas', date: new Date('2024-12-01'), amount: 600 },
      ]);
    });

    it('should calculate histogram data', async () => {
      const request = new NextRequest('http://localhost:3000/api/v2/display-data', {
        method: 'POST',
        body: JSON.stringify({
          displayType: 'histogram',
          filters: {
            type: 'gas',
            bucketCount: 50,
          },
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.buckets).toBeDefined();
      expect(data.data.dateRange).toBeDefined();
      expect(data.data.maxCount).toBeGreaterThan(0);
    });
  });

  describe('POST /api/v2/display-data (Table)', () => {
    beforeEach(async () => {
      const service = getEnergyCrudService();
      await service.createMany([
        { userId: testUserId, type: 'power', date: new Date('2024-01-01'), amount: 100 },
        { userId: testUserId, type: 'power', date: new Date('2024-02-01'), amount: 150 },
        { userId: testUserId, type: 'power', date: new Date('2024-03-01'), amount: 200 },
      ]);
    });

    it('should fetch table data from source readings', async () => {
      const request = new NextRequest('http://localhost:3000/api/v2/display-data', {
        method: 'POST',
        body: JSON.stringify({
          displayType: 'table',
          filters: { type: 'power' },
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(3);
      expect(data.cacheHit).toBe(false); // No cache for table data yet
    });

    it('should support pagination for table data', async () => {
      const request = new NextRequest('http://localhost:3000/api/v2/display-data', {
        method: 'POST',
        body: JSON.stringify({
          displayType: 'table',
          filters: {
            type: 'power',
            limit: 2,
            offset: 1,
          },
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.length).toBeLessThanOrEqual(2);
    });
  });

  describe('DELETE /api/v2/display-data (Invalidate Cache)', () => {
    beforeEach(async () => {
      // Create source data and calculate display data
      const service = getEnergyCrudService();
      await service.createMany([
        { userId: testUserId, type: 'power', date: new Date('2024-01-15'), amount: 100 },
      ]);

      const displayService = getDisplayDataService();
      await displayService.calculateMonthlyChartData(testUserId, 'power', 2024);
    });

    it('should invalidate all cached data for user', async () => {
      // Verify cache exists
      const cachedBefore = await DisplayEnergyData.find({ userId: testUserId });
      expect(cachedBefore.length).toBeGreaterThan(0);

      // Invalidate
      const request = new NextRequest(
        'http://localhost:3000/api/v2/display-data?all=true',
        { method: 'DELETE' }
      );

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.meta.deletedCount).toBeGreaterThan(0);

      // Verify cache deleted
      const cachedAfter = await DisplayEnergyData.find({ userId: testUserId });
      expect(cachedAfter).toHaveLength(0);
    });
  });

  describe('Validation', () => {
    it('should reject missing displayType', async () => {
      const request = new NextRequest('http://localhost:3000/api/v2/display-data', {
        method: 'POST',
        body: JSON.stringify({
          filters: { type: 'power' },
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toContain('Missing required field: displayType');
    });

    it('should reject unknown displayType', async () => {
      const request = new NextRequest('http://localhost:3000/api/v2/display-data', {
        method: 'POST',
        body: JSON.stringify({
          displayType: 'unknown-type',
          filters: {},
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toContain('Unknown display type');
    });
  });

  describe('Performance', () => {
    beforeEach(async () => {
      // Create larger dataset
      const service = getEnergyCrudService();
      const readings = Array.from({ length: 100 }, (_, i) => ({
        userId: testUserId,
        type: 'power' as const,
        date: new Date(2024, 0, i + 1),
        amount: 10000 + i * 10,
      }));
      await service.createMany(readings);
    });

    it('should calculate display data quickly (<2000ms)', async () => {
      const request = new NextRequest('http://localhost:3000/api/v2/display-data', {
        method: 'POST',
        body: JSON.stringify({
          displayType: 'monthly-chart',
          filters: { type: 'power', year: 2024 },
        }),
      });

      const start = Date.now();
      await POST(request);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(2000);
    });

    it('should serve cached data very quickly (<100ms)', async () => {
      const requestBody = JSON.stringify({
        displayType: 'monthly-chart',
        filters: { type: 'power', year: 2024 },
      });

      // First request - calculate
      const request1 = new NextRequest('http://localhost:3000/api/v2/display-data', {
        method: 'POST',
        body: requestBody,
      });
      await POST(request1);

      // Second request - from cache
      const request2 = new NextRequest('http://localhost:3000/api/v2/display-data', {
        method: 'POST',
        body: requestBody,
      });

      const start = Date.now();
      await POST(request2);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100); // Should be very fast (cache hit)
    });
  });

  describe('End-to-end cache workflow', () => {
    it('should support complete cache lifecycle', async () => {
      const service = getEnergyCrudService();

      // 1. Create source data
      await service.create({
        userId: testUserId,
        type: 'power',
        date: new Date('2024-01-15'),
        amount: 100,
      });

      // 2. Calculate display data (cache miss)
      const request1 = new NextRequest('http://localhost:3000/api/v2/display-data', {
        method: 'POST',
        body: JSON.stringify({
          displayType: 'monthly-chart',
          filters: { type: 'power', year: 2024 },
        }),
      });
      const response1 = await POST(request1);
      const data1 = await response1.json();
      expect(data1.cacheHit).toBe(false);

      // 3. Fetch again (cache hit)
      const request2 = new NextRequest('http://localhost:3000/api/v2/display-data', {
        method: 'POST',
        body: JSON.stringify({
          displayType: 'monthly-chart',
          filters: { type: 'power', year: 2024 },
        }),
      });
      const response2 = await POST(request2);
      const data2 = await response2.json();
      expect(data2.cacheHit).toBe(true);

      // 4. Update source data (triggers cache invalidation)
      await service.create({
        userId: testUserId,
        type: 'power',
        date: new Date('2024-02-15'),
        amount: 150,
      });
      await new Promise(resolve => setTimeout(resolve, 300));

      // 5. Fetch again (cache invalidated, recalculated)
      const request3 = new NextRequest('http://localhost:3000/api/v2/display-data', {
        method: 'POST',
        body: JSON.stringify({
          displayType: 'monthly-chart',
          filters: { type: 'power', year: 2024 },
        }),
      });
      const response3 = await POST(request3);
      const data3 = await response3.json();
      expect(data3.cacheHit).toBe(false); // Recalculated due to invalidation
      expect(data3.data.sourceDataHash).not.toBe(data1.data.sourceDataHash); // Hash changed

      // 6. Manual cache invalidation
      const deleteRequest = new NextRequest(
        'http://localhost:3000/api/v2/display-data?all=true',
        { method: 'DELETE' }
      );
      await DELETE(deleteRequest);

      // 7. Fetch again (cache empty, recalculated)
      const request4 = new NextRequest('http://localhost:3000/api/v2/display-data', {
        method: 'POST',
        body: JSON.stringify({
          displayType: 'monthly-chart',
          filters: { type: 'power', year: 2024 },
        }),
      });
      const response4 = await POST(request4);
      const data4 = await response4.json();
      expect(data4.cacheHit).toBe(false);
    });
  });
});
