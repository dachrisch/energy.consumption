/**
 * Feature Flags Service Tests
 *
 * Tests for enhanced feature flag system with:
 * - Rollout percentage support
 * - User whitelist/blacklist
 * - Deterministic user assignment
 */

// Mock MongoDB connection BEFORE any imports
jest.mock('../mongodb', () => ({
  connectDB: jest.fn().mockResolvedValue(undefined),
}));

// Mock Mongoose model BEFORE importing
jest.mock('@/models/FeatureFlag', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn().mockReturnValue({
      exec: jest.fn(),
    }),
    findOneAndUpdate: jest.fn().mockReturnValue({
      exec: jest.fn(),
    }),
  },
}));

import { connectDB } from '../mongodb';
import FeatureFlag from '@/models/FeatureFlag';
import {
  isFeatureEnabled,
  isFeatureEnabledForUser,
  setFeatureFlag,
  getFeatureFlag,
} from '../featureFlags';

describe('Feature Flags Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isFeatureEnabled (existing)', () => {
    it('should return true when flag is enabled', async () => {
      const mockFlag = { name: 'test_flag', enabled: true };
      // isFeatureEnabled uses await directly on findOne, not exec()
      (FeatureFlag.findOne as jest.Mock).mockResolvedValue(mockFlag);

      const result = await isFeatureEnabled('test_flag');

      expect(result).toBe(true);
      expect(connectDB).toHaveBeenCalledTimes(1);
      expect(FeatureFlag.findOne).toHaveBeenCalledWith({ name: 'test_flag' });
    });

    it('should return false when flag is disabled', async () => {
      const mockFlag = { name: 'test_flag', enabled: false };
      (FeatureFlag.findOne as jest.Mock).mockResolvedValue(mockFlag);

      const result = await isFeatureEnabled('test_flag');

      expect(result).toBe(false);
    });

    it('should return false when flag does not exist', async () => {
      (FeatureFlag.findOne as jest.Mock).mockResolvedValue(null);

      const result = await isFeatureEnabled('non_existent');

      expect(result).toBe(false);
    });
  });

  describe('isFeatureEnabledForUser (new)', () => {
    it('should return false when flag does not exist', async () => {
      const mockExec = jest.fn().mockResolvedValue(null);
      (FeatureFlag.findOne as jest.Mock).mockReturnValue({ exec: mockExec });

      const result = await isFeatureEnabledForUser('non_existent', 'user123');

      expect(result).toBe(false);
    });

    it('should return false when flag is disabled', async () => {
      const mockFlag = {
        name: 'test_flag',
        enabled: false,
        rolloutPercent: 100,
        userWhitelist: [],
        userBlacklist: [],
      };
      const mockExec = jest.fn().mockResolvedValue(mockFlag);
      (FeatureFlag.findOne as jest.Mock).mockReturnValue({ exec: mockExec });

      const result = await isFeatureEnabledForUser('test_flag', 'user123');

      expect(result).toBe(false);
    });

    it('should return true when user is in whitelist', async () => {
      const mockFlag = {
        name: 'test_flag',
        enabled: true,
        rolloutPercent: 0, // Even at 0%, whitelist should work
        userWhitelist: ['user123', 'user456'],
        userBlacklist: [],
      };
      const mockExec = jest.fn().mockResolvedValue(mockFlag);
      (FeatureFlag.findOne as jest.Mock).mockReturnValue({ exec: mockExec });

      const result = await isFeatureEnabledForUser('test_flag', 'user123');

      expect(result).toBe(true);
    });

    it('should return false when user is in blacklist', async () => {
      const mockFlag = {
        name: 'test_flag',
        enabled: true,
        rolloutPercent: 100, // Even at 100%, blacklist should work
        userWhitelist: [],
        userBlacklist: ['user123', 'user456'],
      };
      const mockExec = jest.fn().mockResolvedValue(mockFlag);
      (FeatureFlag.findOne as jest.Mock).mockReturnValue({ exec: mockExec });

      const result = await isFeatureEnabledForUser('test_flag', 'user123');

      expect(result).toBe(false);
    });

    it('should prioritize whitelist over blacklist', async () => {
      const mockFlag = {
        name: 'test_flag',
        enabled: true,
        rolloutPercent: 50,
        userWhitelist: ['user123'],
        userBlacklist: ['user123'], // User in both lists
      };
      const mockExec = jest.fn().mockResolvedValue(mockFlag);
      (FeatureFlag.findOne as jest.Mock).mockReturnValue({ exec: mockExec });

      const result = await isFeatureEnabledForUser('test_flag', 'user123');

      expect(result).toBe(true); // Whitelist takes precedence
    });

    it('should return true when rollout is 100%', async () => {
      const mockFlag = {
        name: 'test_flag',
        enabled: true,
        rolloutPercent: 100,
        userWhitelist: [],
        userBlacklist: [],
      };
      const mockExec = jest.fn().mockResolvedValue(mockFlag);
      (FeatureFlag.findOne as jest.Mock).mockReturnValue({ exec: mockExec });

      const result = await isFeatureEnabledForUser('test_flag', 'any_user');

      expect(result).toBe(true);
    });

    it('should return false when rollout is 0%', async () => {
      const mockFlag = {
        name: 'test_flag',
        enabled: true,
        rolloutPercent: 0,
        userWhitelist: [],
        userBlacklist: [],
      };
      const mockExec = jest.fn().mockResolvedValue(mockFlag);
      (FeatureFlag.findOne as jest.Mock).mockReturnValue({ exec: mockExec });

      const result = await isFeatureEnabledForUser('test_flag', 'any_user');

      expect(result).toBe(false);
    });

    it('should use deterministic hash for percentage rollout', async () => {
      const mockFlag = {
        name: 'test_flag',
        enabled: true,
        rolloutPercent: 50,
        userWhitelist: [],
        userBlacklist: [],
      };
      const mockExec = jest.fn().mockResolvedValue(mockFlag);
      (FeatureFlag.findOne as jest.Mock).mockReturnValue({ exec: mockExec });

      // Same user should get same result across multiple calls
      const result1 = await isFeatureEnabledForUser('test_flag', 'user123');
      const result2 = await isFeatureEnabledForUser('test_flag', 'user123');
      const result3 = await isFeatureEnabledForUser('test_flag', 'user123');

      expect(result1).toBe(result2);
      expect(result2).toBe(result3);
    });

    it('should distribute users across rollout percentage', async () => {
      const mockFlag = {
        name: 'test_flag',
        enabled: true,
        rolloutPercent: 50,
        userWhitelist: [],
        userBlacklist: [],
      };
      const mockExec = jest.fn().mockResolvedValue(mockFlag);
      (FeatureFlag.findOne as jest.Mock).mockReturnValue({ exec: mockExec });

      // Test with many users to verify distribution
      const results = await Promise.all(
        Array.from({ length: 100 }, (_, i) =>
          isFeatureEnabledForUser('test_flag', `user${i}`)
        )
      );

      const enabledCount = results.filter(r => r).length;

      // Should be roughly 50% (allow ±20% variance due to hash distribution)
      expect(enabledCount).toBeGreaterThan(30);
      expect(enabledCount).toBeLessThan(70);
    });

    it('should handle undefined whitelist/blacklist gracefully', async () => {
      const mockFlag = {
        name: 'test_flag',
        enabled: true,
        rolloutPercent: 100,
        // No whitelist/blacklist fields
      };
      const mockExec = jest.fn().mockResolvedValue(mockFlag);
      (FeatureFlag.findOne as jest.Mock).mockReturnValue({ exec: mockExec });

      const result = await isFeatureEnabledForUser('test_flag', 'user123');

      expect(result).toBe(true);
    });
  });

  describe('setFeatureFlag (new)', () => {
    it('should create new feature flag', async () => {
      const mockFindOneAndUpdate = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          name: 'new_flag',
          enabled: true,
          rolloutPercent: 50,
          userWhitelist: [],
          userBlacklist: [],
        }),
      });
      (FeatureFlag.findOneAndUpdate as jest.Mock) = mockFindOneAndUpdate;

      const result = await setFeatureFlag('new_flag', {
        enabled: true,
        rolloutPercent: 50,
      });

      expect(connectDB).toHaveBeenCalled();
      expect(mockFindOneAndUpdate).toHaveBeenCalledWith(
        { name: 'new_flag' },
        { $set: { enabled: true, rolloutPercent: 50 } },
        { upsert: true, new: true }
      );
      expect(result.name).toBe('new_flag');
    });

    it('should update existing feature flag', async () => {
      const mockFindOneAndUpdate = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          name: 'existing_flag',
          enabled: false,
          rolloutPercent: 0,
          userWhitelist: [],
          userBlacklist: [],
        }),
      });
      (FeatureFlag.findOneAndUpdate as jest.Mock) = mockFindOneAndUpdate;

      const result = await setFeatureFlag('existing_flag', {
        enabled: false,
        rolloutPercent: 0,
      });

      expect(result.enabled).toBe(false);
      expect(result.rolloutPercent).toBe(0);
    });
  });

  describe('getFeatureFlag (new)', () => {
    it('should fetch feature flag from database', async () => {
      const mockFlag = {
        name: 'test_flag',
        enabled: true,
        rolloutPercent: 75,
        userWhitelist: ['user1'],
        userBlacklist: ['user2'],
      };
      const mockExec = jest.fn().mockResolvedValue(mockFlag);
      (FeatureFlag.findOne as jest.Mock).mockReturnValue({ exec: mockExec });

      const result = await getFeatureFlag('test_flag');

      expect(connectDB).toHaveBeenCalled();
      expect(FeatureFlag.findOne).toHaveBeenCalledWith({ name: 'test_flag' });
      expect(result).toEqual(mockFlag);
    });

    it('should return null when flag does not exist', async () => {
      const mockExec = jest.fn().mockResolvedValue(null);
      (FeatureFlag.findOne as jest.Mock).mockReturnValue({ exec: mockExec });

      const result = await getFeatureFlag('non_existent');

      expect(result).toBeNull();
    });
  });

  describe('Hash function determinism', () => {
    it('should generate same hash for same userId consistently', async () => {
      const mockFlag = {
        name: 'test_flag',
        enabled: true,
        rolloutPercent: 50,
        userWhitelist: [],
        userBlacklist: [],
      };
      const mockExec = jest.fn().mockResolvedValue(mockFlag);
      (FeatureFlag.findOne as jest.Mock).mockReturnValue({ exec: mockExec });

      // Call multiple times with same userId
      const results = await Promise.all([
        isFeatureEnabledForUser('test_flag', 'consistent_user'),
        isFeatureEnabledForUser('test_flag', 'consistent_user'),
        isFeatureEnabledForUser('test_flag', 'consistent_user'),
        isFeatureEnabledForUser('test_flag', 'consistent_user'),
        isFeatureEnabledForUser('test_flag', 'consistent_user'),
      ]);

      // All results should be identical
      const firstResult = results[0];
      expect(results.every(r => r === firstResult)).toBe(true);
    });

    it('should generate different hashes for different userIds', async () => {
      const mockFlag = {
        name: 'test_flag',
        enabled: true,
        rolloutPercent: 50,
        userWhitelist: [],
        userBlacklist: [],
      };
      const mockExec = jest.fn().mockResolvedValue(mockFlag);
      (FeatureFlag.findOne as jest.Mock).mockReturnValue({ exec: mockExec });

      // Test a larger sample to ensure distribution
      const results = await Promise.all([
        isFeatureEnabledForUser('test_flag', 'alice@example.com'),
        isFeatureEnabledForUser('test_flag', 'bob@example.com'),
        isFeatureEnabledForUser('test_flag', 'charlie@example.com'),
        isFeatureEnabledForUser('test_flag', 'david@example.com'),
        isFeatureEnabledForUser('test_flag', 'eve@example.com'),
        isFeatureEnabledForUser('test_flag', 'frank@example.com'),
        isFeatureEnabledForUser('test_flag', 'grace@example.com'),
        isFeatureEnabledForUser('test_flag', 'henry@example.com'),
      ]);

      // At 50% rollout with different userIds, should get mixed results
      const uniqueResults = new Set(results);
      expect(uniqueResults.size).toBeGreaterThan(1);
    });
  });
});
