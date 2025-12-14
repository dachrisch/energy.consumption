/**
 * Jest Setup for Integration Tests
 *
 * This file configures the test environment for integration tests that require:
 * - MongoDB connection
 * - Mongoose models
 * - NextAuth mocking
 */

import mongoose from 'mongoose';

// Mock NextAuth to avoid import errors in integration tests
jest.mock('next-auth', () => {
  const actualNextAuth = jest.requireActual('next-auth');
  return {
    __esModule: true,
    default: jest.fn(() => jest.fn()),
    ...actualNextAuth,
  };
});

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: null,
    status: 'unauthenticated',
  })),
  signIn: jest.fn(),
  signOut: jest.fn(),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Global test setup
beforeAll(async () => {
  // Set a longer timeout for integration tests
  jest.setTimeout(30000);

  // Ensure we start with a clean Mongoose state
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  // Connect to MongoDB if MONGODB_URI is set
  const mongoUri = process.env.MONGODB_URI;
  if (mongoUri) {
    try {
      await mongoose.connect(mongoUri, {
        dbName: 'energy_consumption',
        serverSelectionTimeoutMS: 5000,
      });
      console.log('[Test Setup] MongoDB connected successfully');
    } catch (error) {
      console.error('[Test Setup] MongoDB connection failed:', error);
    }
  }
});

// Cleanup after all tests
afterAll(async () => {
  // Close all mongoose connections
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close(true); // Force close
  }

  // Clear all timers
  jest.clearAllTimers();
});

// Global error handler for unhandled promise rejections
process.on('unhandledRejection', (error) => {
  console.error('Unhandled Promise Rejection in tests:', error);
});
