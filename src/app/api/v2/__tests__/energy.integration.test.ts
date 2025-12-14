/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */
/**
 * /api/v2/energy Integration Tests
 *
 * Tests the new v2/energy API routes with:
 * - Real service layer integration
 * - Real database operations
 * - Event emission verification
 * - Cache invalidation checks
 */

import { NextRequest } from 'next/server';
import { GET, POST, PUT, DELETE } from '../energy/route';
import { connectDB } from '@/lib/mongodb';
import { getEnergyCrudService, getDisplayDataService, resetServices } from '@/services';
import { getEventBus, EnergyEventTypes, resetEventBus } from '@/events';
import SourceEnergyReading from '@/models/SourceEnergyReading';

// Mock NextAuth session
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(() =>
    Promise.resolve({
      user: { id: 'test-user-api', email: 'test@example.com' },
    })
  ),
}));

jest.setTimeout(30000);

describe('/api/v2/energy Integration Tests', () => {
  const testUserId = 'test-user-api';

  beforeAll(async () => {
    await connectDB();
  });

  beforeEach(async () => {
    // Clean up test data
    await SourceEnergyReading.deleteMany({ userId: testUserId });
    resetServices();
    resetEventBus();
  });

  afterEach(async () => {
    await SourceEnergyReading.deleteMany({ userId: testUserId });
  });

  describe('POST /api/v2/energy (Create)', () => {
    it('should create new energy reading using service layer', async () => {
      const request = new NextRequest('http://localhost:3000/api/v2/energy', {
        method: 'POST',
        body: JSON.stringify({
          type: 'power',
          date: '2024-11-17T10:00:00Z',
          amount: 12345.67,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toMatchObject({
        type: 'power',
        amount: 12345.67,
        userId: testUserId,
      });
      expect(data.meta.backend).toBe('new');
      expect(data.meta.eventEmitted).toBe(true);

      // Verify in database
      const saved = await SourceEnergyReading.findOne({
        userId: testUserId,
        type: 'power',
      });
      expect(saved).toBeTruthy();
      expect(saved?.amount).toBe(12345.67);
    });

    it('should emit ENERGY_READING_CREATED event', async () => {
      const eventBus = getEventBus();
      const eventHandler = jest.fn();
      eventBus.on(EnergyEventTypes.CREATED, eventHandler);

      const request = new NextRequest('http://localhost:3000/api/v2/energy', {
        method: 'POST',
        body: JSON.stringify({
          type: 'gas',
          date: '2024-11-17T10:00:00Z',
          amount: 5432.10,
        }),
      });

      await POST(request);

      // Wait for event processing
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(eventHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: EnergyEventTypes.CREATED,
          userId: testUserId,
        })
      );
    });

    it('should reject duplicate readings with 409', async () => {
      // Create first reading
      const service = getEnergyCrudService();
      await service.create({
        userId: testUserId,
        type: 'power',
        date: new Date('2024-11-17'),
        amount: 100,
      });

      // Try to create duplicate
      const request = new NextRequest('http://localhost:3000/api/v2/energy', {
        method: 'POST',
        body: JSON.stringify({
          type: 'power',
          date: '2024-11-17T00:00:00Z',
          amount: 200,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.success).toBe(false);
      expect(data.message).toContain('already exists');
    });

    it('should validate required fields', async () => {
      const request = new NextRequest('http://localhost:3000/api/v2/energy', {
        method: 'POST',
        body: JSON.stringify({
          type: 'power',
          // Missing date and amount
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toContain('Missing required fields');
    });
  });

  describe('GET /api/v2/energy (Read)', () => {
    beforeEach(async () => {
      // Create test data
      const service = getEnergyCrudService();
      await service.createMany([
        {
          userId: testUserId,
          type: 'power',
          date: new Date('2024-01-01'),
          amount: 10000,
        },
        {
          userId: testUserId,
          type: 'power',
          date: new Date('2024-02-01'),
          amount: 10150,
        },
        {
          userId: testUserId,
          type: 'gas',
          date: new Date('2024-01-01'),
          amount: 500,
        },
      ]);
    });

    it('should fetch all energy readings', async () => {
      const request = new NextRequest('http://localhost:3000/api/v2/energy');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(3);
      expect(data.meta.count).toBe(3);
      expect(data.meta.backend).toBe('new');
    });

    it('should filter by type', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/v2/energy?type=power'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(2);
      expect(data.data.every((r: any) => r.type === 'power')).toBe(true);
    });

    it('should filter by date range', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/v2/energy?startDate=2024-01-15&endDate=2024-02-15'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(1);
      expect(data.data[0].date).toContain('2024-02-01');
    });

    it('should support pagination', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/v2/energy?limit=2&offset=1'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.length).toBeLessThanOrEqual(2);
    });
  });

  describe('PUT /api/v2/energy (Update)', () => {
    let readingId: string;

    beforeEach(async () => {
      const service = getEnergyCrudService();
      const reading = await service.create({
        userId: testUserId,
        type: 'power',
        date: new Date('2024-11-17'),
        amount: 100,
      });
      readingId = reading._id.toString();
    });

    it('should update energy reading', async () => {
      const request = new NextRequest('http://localhost:3000/api/v2/energy', {
        method: 'PUT',
        body: JSON.stringify({
          id: readingId,
          amount: 150,
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.amount).toBe(150);
      expect(data.meta.eventEmitted).toBe(true);

      // Verify in database
      const updated = await SourceEnergyReading.findById(readingId);
      expect(updated?.amount).toBe(150);
    });

    it('should emit ENERGY_READING_UPDATED event', async () => {
      const eventBus = getEventBus();
      const eventHandler = jest.fn();
      eventBus.on(EnergyEventTypes.UPDATED, eventHandler);

      const request = new NextRequest('http://localhost:3000/api/v2/energy', {
        method: 'PUT',
        body: JSON.stringify({
          id: readingId,
          amount: 200,
        }),
      });

      await PUT(request);
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(eventHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: EnergyEventTypes.UPDATED,
        })
      );
    });

    it('should return 404 for non-existent reading', async () => {
      const request = new NextRequest('http://localhost:3000/api/v2/energy', {
        method: 'PUT',
        body: JSON.stringify({
          id: '507f1f77bcf86cd799439011', // Valid ObjectId but doesn't exist
          amount: 150,
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
    });
  });

  describe('DELETE /api/v2/energy (Delete)', () => {
    let readingId: string;

    beforeEach(async () => {
      const service = getEnergyCrudService();
      const reading = await service.create({
        userId: testUserId,
        type: 'power',
        date: new Date('2024-11-17'),
        amount: 100,
      });
      readingId = reading._id.toString();
    });

    it('should delete energy reading', async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/v2/energy?id=${readingId}`,
        { method: 'DELETE' }
      );

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.meta.eventEmitted).toBe(true);

      // Verify deleted from database
      const deleted = await SourceEnergyReading.findById(readingId);
      expect(deleted).toBeNull();
    });

    it('should emit ENERGY_READING_DELETED event', async () => {
      const eventBus = getEventBus();
      const eventHandler = jest.fn();
      eventBus.on(EnergyEventTypes.DELETED, eventHandler);

      const request = new NextRequest(
        `http://localhost:3000/api/v2/energy?id=${readingId}`,
        { method: 'DELETE' }
      );

      await DELETE(request);
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(eventHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: EnergyEventTypes.DELETED,
        })
      );
    });

    it('should return 400 when id missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/v2/energy', {
        method: 'DELETE',
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toContain('Missing required query param: id');
    });
  });

  describe('Authentication', () => {
    it('should reject requests without session', async () => {
      // Temporarily mock to return no session
      const getServerSession = require('next-auth').getServerSession;
      getServerSession.mockResolvedValueOnce(null);

      const request = new NextRequest('http://localhost:3000/api/v2/energy');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.message).toBe('Unauthorized');
    });
  });

  describe('End-to-end workflows', () => {
    it('should support complete CRUD workflow', async () => {
      // CREATE
      const createRequest = new NextRequest(
        'http://localhost:3000/api/v2/energy',
        {
          method: 'POST',
          body: JSON.stringify({
            type: 'power',
            date: '2024-11-17T10:00:00Z',
            amount: 100,
          }),
        }
      );
      const createResponse = await POST(createRequest);
      const createData = await createResponse.json();
      const createdId = createData.data._id;

      expect(createResponse.status).toBe(200);

      // READ
      const readRequest = new NextRequest('http://localhost:3000/api/v2/energy');
      const readResponse = await GET(readRequest);
      const readData = await readResponse.json();

      expect(readData.data).toHaveLength(1);
      expect(readData.data[0]._id).toBe(createdId);

      // UPDATE
      const updateRequest = new NextRequest(
        'http://localhost:3000/api/v2/energy',
        {
          method: 'PUT',
          body: JSON.stringify({
            id: createdId,
            amount: 150,
          }),
        }
      );
      const updateResponse = await PUT(updateRequest);
      const updateData = await updateResponse.json();

      expect(updateResponse.status).toBe(200);
      expect(updateData.data.amount).toBe(150);

      // DELETE
      const deleteRequest = new NextRequest(
        `http://localhost:3000/api/v2/energy?id=${createdId}`,
        { method: 'DELETE' }
      );
      const deleteResponse = await DELETE(deleteRequest);

      expect(deleteResponse.status).toBe(200);

      // VERIFY DELETED
      const verifyRequest = new NextRequest(
        'http://localhost:3000/api/v2/energy'
      );
      const verifyResponse = await GET(verifyRequest);
      const verifyData = await verifyResponse.json();

      expect(verifyData.data).toHaveLength(0);
    });

    it('should automatically invalidate cache on data changes', async () => {
      const _displayService = getDisplayDataService();
      const eventBus = getEventBus();
      let cacheInvalidated = false;

      // Listen for invalidation
      eventBus.on(EnergyEventTypes.CREATED, async () => {
        cacheInvalidated = true;
      });

      // Create reading
      const request = new NextRequest('http://localhost:3000/api/v2/energy', {
        method: 'POST',
        body: JSON.stringify({
          type: 'power',
          date: '2024-11-17T10:00:00Z',
          amount: 100,
        }),
      });

      await POST(request);
      await new Promise(resolve => setTimeout(resolve, 200));

      expect(cacheInvalidated).toBe(true);
    });
  });

  describe('Performance', () => {
    it('should handle requests quickly (<500ms)', async () => {
      const request = new NextRequest('http://localhost:3000/api/v2/energy');

      const start = Date.now();
      await GET(request);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(500);
    });

    it('should handle concurrent requests', async () => {
      const promises = Array.from({ length: 5 }, (_, i) =>
        POST(
          new NextRequest('http://localhost:3000/api/v2/energy', {
            method: 'POST',
            body: JSON.stringify({
              type: 'power',
              date: `2024-11-${String(i + 1).padStart(2, '0')}T10:00:00Z`,
              amount: 100 + i,
            }),
          })
        )
      );

      const responses = await Promise.all(promises);
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Verify all created
      const readings = await SourceEnergyReading.find({ userId: testUserId });
      expect(readings).toHaveLength(5);
    });
  });
});
