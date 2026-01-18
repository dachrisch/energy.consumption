/**
 * Jest Setup for Integration Tests
 */

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod: MongoMemoryServer;

const mockSession = {
  user: {
    id: '000000000000000000000001',
    email: 'test@example.com',
    name: 'Test User',
  },
};

// EXTREMELY robust mock for NextAuth
jest.mock('next-auth', () => {
  const getServerSession = jest.fn(() => Promise.resolve(mockSession));
  
  // The mock function itself
  const mockNextAuth: any = jest.fn(() => ({
    GET: jest.fn(),
    POST: jest.fn(),
  }));

  // Standard NextAuth pattern: default export is the function, 
  // and it also has named exports
  mockNextAuth.getServerSession = getServerSession;
  
  // For ESM
  return {
    __esModule: true,
    default: mockNextAuth,
    getServerSession,
  };
});

jest.mock('next-auth/next', () => ({
  __esModule: true,
  default: mockNextAuth,
  getServerSession: mockNextAuth.getServerSession,
}));

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: mockSession,
    status: 'authenticated',
  })),
  signIn: jest.fn(),
  signOut: jest.fn(),
  SessionProvider: ({ children }: any) => children,
}));

beforeAll(async () => {
  jest.setTimeout(60000);

  // Spin up in-memory MongoDB
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  process.env.MONGODB_URI = uri;

  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  await mongoose.connect(uri, {
    dbName: 'energy_consumption_test',
  });
  console.log('[Integration Setup] In-memory MongoDB connected');

  // Initialize server infrastructure after DB is ready
  const { initializeServer } = await import('./src/lib/serverInit');
  await initializeServer();
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
  if (mongod) {
    await mongod.stop();
  }
});
