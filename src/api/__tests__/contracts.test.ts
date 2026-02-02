import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import Contract from '../../models/Contract';
import Meter from '../../models/Meter';
import User from '../../models/User';
import { apiHandler } from '../handler';
import jwt from 'jsonwebtoken';

describe('Contract API & Validation', () => {
  let mongoServer: MongoMemoryServer;
  let userId: string;
  let meterId: string;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    process.env.MONGODB_URI = uri;
    await mongoose.connect(uri);
    
    const user = await User.create({ name: 'Test', email: 'test@test.com', password: '123' });
    userId = user._id.toString();
    
    const meter = await Meter.create({ name: 'Power', meterNumber: 'P1', type: 'power', unit: 'kWh', userId });
    meterId = meter._id.toString();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await Contract.deleteMany({});
  });

  it('prevents overlapping contract periods', async () => {
    // Create initial contract: Jan to June
    await Contract.create({
      providerName: 'Provider A',
      type: 'power',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-06-30'),
      basePrice: 10,
      workingPrice: 0.3,
      meterId,
      userId
    });

    // Try to create overlapping contract: March to Dec
    const req = {
      url: '/api/contracts',
      method: 'POST',
      headers: { 
        host: 'localhost', 
        cookie: `token=${jwt.sign({ userId }, process.env.JWT_SECRET || 'secret')}` 
      },
      body: {
        providerName: 'Provider B',
        type: 'power',
        startDate: '2026-03-01',
        endDate: '2026-12-31',
        basePrice: 12,
        workingPrice: 0.35,
        meterId
      }
    };

    let responseBody: any;
    const res = {
      statusCode: 200,
      setHeader: () => {},
      end: (data: string) => {
        responseBody = JSON.parse(data);
      }
    };

    await apiHandler(req as any, res as any);
    
    expect(res.statusCode).toBe(400);
    expect(responseBody.error).toContain('overlaps');
  });

  it('correctly maps all required fields from the request body', async () => {
    const contractData = {
      providerName: 'Test Provider',
      type: 'power',
      startDate: '2027-01-01T00:00:00.000Z',
      endDate: '2027-12-31T00:00:00.000Z',
      basePrice: 15.50,
      workingPrice: 0.3221,
      meterId
    };

    const req = {
      url: '/api/contracts',
      method: 'POST',
      headers: { 
        host: 'localhost', 
        cookie: `token=${jwt.sign({ userId }, process.env.JWT_SECRET || 'secret')}` 
      },
      body: contractData
    };

    let responseBody: any;
    const res = {
      statusCode: 200,
      setHeader: () => {},
      end: (data: string) => {
        responseBody = JSON.parse(data);
      }
    };

    await apiHandler(req as any, res as any);
    
    expect(res.statusCode).toBe(201);
    expect(responseBody.providerName).toBe(contractData.providerName);
    expect(responseBody.basePrice).toBe(contractData.basePrice);
    expect(responseBody.workingPrice).toBe(contractData.workingPrice);
    expect(responseBody.meterId).toBe(meterId);
    expect(new Date(responseBody.startDate).toISOString()).toBe(contractData.startDate);
  });
});
