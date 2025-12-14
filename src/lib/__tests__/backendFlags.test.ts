/* eslint-disable @typescript-eslint/no-explicit-any */
import { checkBackendFlag, isNewBackendEnabled, initializeBackendFlags, getAllBackendFlags } from '../backendFlags';
import { setFeatureFlag, getFeatureFlag } from '../featureFlags';
import { getServerSession } from 'next-auth';

// Mock next-auth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

// Mock feature flags
jest.mock('../featureFlags', () => ({
  isFeatureEnabledForUser: jest.fn(),
  isFeatureEnabled: jest.fn(),
  getFeatureFlag: jest.fn(),
  setFeatureFlag: jest.fn(),
}));

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const mockIsFeatureEnabledForUser = require('../featureFlags').isFeatureEnabledForUser as jest.Mock;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const mockIsFeatureEnabled = require('../featureFlags').isFeatureEnabled as jest.Mock;
const mockGetFeatureFlag = getFeatureFlag as jest.MockedFunction<typeof getFeatureFlag>;
const mockSetFeatureFlag = setFeatureFlag as jest.MockedFunction<typeof setFeatureFlag>;

describe('Backend Flags', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkBackendFlag()', () => {
    it('should return false when no user session', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const result = await checkBackendFlag();

      expect(result).toBe(false);
    });

    it('should check global flag when no component specified', async () => {
      mockGetServerSession.mockResolvedValue({ user: { id: 'user123' } } as any);
      mockIsFeatureEnabledForUser.mockResolvedValue(true);

      const result = await checkBackendFlag();

      expect(mockIsFeatureEnabledForUser).toHaveBeenCalledWith('NEW_BACKEND_ENABLED', 'user123');
      expect(result).toBe(true);
    });

    it('should check component-specific flag when component specified', async () => {
      mockGetServerSession.mockResolvedValue({ user: { id: 'user123' } } as any);
      mockIsFeatureEnabledForUser
        .mockResolvedValueOnce(false) // Global flag OFF
        .mockResolvedValueOnce(true); // Component flag ON

      const result = await checkBackendFlag('dashboard');

      expect(mockIsFeatureEnabledForUser).toHaveBeenCalledWith('NEW_BACKEND_ENABLED', 'user123');
      expect(mockIsFeatureEnabledForUser).toHaveBeenCalledWith('DASHBOARD_NEW_BACKEND', 'user123');
      expect(result).toBe(true);
    });

    it('should use provided userId instead of session', async () => {
      mockIsFeatureEnabledForUser.mockResolvedValue(true);

      const result = await checkBackendFlag('charts', 'custom-user-id');

      expect(mockGetServerSession).not.toHaveBeenCalled();
      expect(mockIsFeatureEnabledForUser).toHaveBeenCalledWith('NEW_BACKEND_ENABLED', 'custom-user-id');
      expect(mockIsFeatureEnabledForUser).toHaveBeenCalledWith('CHARTS_NEW_BACKEND', 'custom-user-id');
      expect(result).toBe(true);
    });

    it('should convert component name to uppercase', async () => {
      mockGetServerSession.mockResolvedValue({ user: { id: 'user123' } } as any);
      mockIsFeatureEnabledForUser.mockResolvedValue(true);

      await checkBackendFlag('timeline', 'user123');

      expect(mockIsFeatureEnabledForUser).toHaveBeenCalledWith('TIMELINE_NEW_BACKEND', 'user123');
    });

    it('should handle component flag overriding global flag (component ON, global OFF)', async () => {
      mockGetServerSession.mockResolvedValue({ user: { id: 'user123' } } as any);
      mockIsFeatureEnabledForUser
        .mockResolvedValueOnce(false) // Global OFF
        .mockResolvedValueOnce(true); // Component ON

      const result = await checkBackendFlag('dashboard', 'user123');

      expect(result).toBe(true); // Component flag wins
    });

    it('should handle component flag overriding global flag (component OFF, global ON)', async () => {
      mockGetServerSession.mockResolvedValue({ user: { id: 'user123' } } as any);
      mockIsFeatureEnabledForUser
        .mockResolvedValueOnce(true) // Global ON
        .mockResolvedValueOnce(false); // Component OFF

      const result = await checkBackendFlag('dashboard', 'user123');

      expect(result).toBe(false); // Component flag wins
    });
  });

  describe('isNewBackendEnabled()', () => {
    it('should check global flag without user context', async () => {
      mockIsFeatureEnabled.mockResolvedValue(true);

      const result = await isNewBackendEnabled();

      expect(mockIsFeatureEnabled).toHaveBeenCalledWith('NEW_BACKEND_ENABLED');
      expect(result).toBe(true);
    });

    it('should return false when global flag disabled', async () => {
      mockIsFeatureEnabled.mockResolvedValue(false);

      const result = await isNewBackendEnabled();

      expect(result).toBe(false);
    });
  });

  describe('initializeBackendFlags()', () => {
    it('should create all default backend flags', async () => {
      mockSetFeatureFlag.mockResolvedValue({} as any);

      await initializeBackendFlags();

      expect(mockSetFeatureFlag).toHaveBeenCalledTimes(6);

      // Check specific flags
      expect(mockSetFeatureFlag).toHaveBeenCalledWith('NEW_BACKEND_ENABLED', expect.objectContaining({
        name: 'NEW_BACKEND_ENABLED',
        enabled: false,
        rolloutPercent: 0,
      }));

      expect(mockSetFeatureFlag).toHaveBeenCalledWith('DASHBOARD_NEW_BACKEND', expect.objectContaining({
        name: 'DASHBOARD_NEW_BACKEND',
        enabled: false,
        rolloutPercent: 0,
      }));

      expect(mockSetFeatureFlag).toHaveBeenCalledWith('CHARTS_NEW_BACKEND', expect.anything());
      expect(mockSetFeatureFlag).toHaveBeenCalledWith('TIMELINE_NEW_BACKEND', expect.anything());
      expect(mockSetFeatureFlag).toHaveBeenCalledWith('CSV_IMPORT_NEW_BACKEND', expect.anything());
      expect(mockSetFeatureFlag).toHaveBeenCalledWith('FORM_NEW_BACKEND', expect.anything());
    });

    it('should handle errors gracefully during initialization', async () => {
      mockSetFeatureFlag
        .mockResolvedValueOnce({} as any) // Success
        .mockRejectedValueOnce(new Error('Database error')) // Failure
        .mockResolvedValueOnce({} as any); // Success

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await initializeBackendFlags();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[BackendFlags] Failed to initialize'),
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('getAllBackendFlags()', () => {
    it('should retrieve all backend flags', async () => {
      const mockFlags = [
        { name: 'NEW_BACKEND_ENABLED', enabled: true, rolloutPercent: 50 },
        { name: 'DASHBOARD_NEW_BACKEND', enabled: false, rolloutPercent: 0 },
        { name: 'CHARTS_NEW_BACKEND', enabled: true, rolloutPercent: 100 },
        { name: 'TIMELINE_NEW_BACKEND', enabled: false, rolloutPercent: 0 },
        { name: 'CSV_IMPORT_NEW_BACKEND', enabled: false, rolloutPercent: 0 },
        { name: 'FORM_NEW_BACKEND', enabled: false, rolloutPercent: 0 },
      ];

      mockGetFeatureFlag.mockImplementation(async (name: string) => {
        return mockFlags.find(f => f.name === name) as any;
      });

      const result = await getAllBackendFlags();

      expect(result).toHaveLength(6);
      expect(result).toEqual(expect.arrayContaining([
        expect.objectContaining({ name: 'NEW_BACKEND_ENABLED' }),
        expect.objectContaining({ name: 'DASHBOARD_NEW_BACKEND' }),
        expect.objectContaining({ name: 'CHARTS_NEW_BACKEND' }),
      ]));
    });

    it('should handle missing flags with defaults', async () => {
      mockGetFeatureFlag.mockResolvedValue(null);

      const result = await getAllBackendFlags();

      expect(result).toHaveLength(6);
      result.forEach(flag => {
        expect(flag).toMatchObject({
          name: expect.any(String),
          enabled: false,
          rolloutPercent: 0,
          description: 'Not initialized',
        });
      });
    });
  });

  describe('Integration scenarios', () => {
    it('should support gradual rollout (50% of users)', async () => {
      mockGetServerSession.mockResolvedValue({ user: { id: 'user123' } } as any);

      // Simulate 50% rollout - some users get new backend, some don't
      mockIsFeatureEnabledForUser.mockImplementation(async (flagName, userId) => {
        // Deterministic based on userId (simulating hash)
        const hash = userId.charCodeAt(0) % 100;
        return hash < 50; // 50% rollout
      });

      const resultUser1 = await checkBackendFlag('dashboard', 'user-A'); // Hash < 50
      const resultUser2 = await checkBackendFlag('dashboard', 'user-z'); // Hash >= 50

      // One should be true, one false (deterministic)
      expect(resultUser1).not.toBe(resultUser2);
    });

    it('should support whitelisting specific components for testing', async () => {
      mockGetServerSession.mockResolvedValue({ user: { id: 'tester' } } as any);

      mockIsFeatureEnabledForUser.mockImplementation(async (flagName) => {
        // Global: OFF
        if (flagName === 'NEW_BACKEND_ENABLED') return false;

        // Dashboard component: ON (for testing)
        if (flagName === 'DASHBOARD_NEW_BACKEND') return true;

        // All others: OFF
        return false;
      });

      const dashboardResult = await checkBackendFlag('dashboard', 'tester');
      const chartsResult = await checkBackendFlag('charts', 'tester');

      expect(dashboardResult).toBe(true); // Enabled for testing
      expect(chartsResult).toBe(false); // Still disabled
    });

    it('should allow emergency disable via component flag', async () => {
      mockGetServerSession.mockResolvedValue({ user: { id: 'user123' } } as any);

      mockIsFeatureEnabledForUser.mockImplementation(async (flagName) => {
        // Global: ON (rolled out)
        if (flagName === 'NEW_BACKEND_ENABLED') return true;

        // Dashboard component: OFF (emergency disable)
        if (flagName === 'DASHBOARD_NEW_BACKEND') return false;

        // Other components: ON
        return true;
      });

      const dashboardResult = await checkBackendFlag('dashboard', 'user123');
      const chartsResult = await checkBackendFlag('charts', 'user123');

      expect(dashboardResult).toBe(false); // Emergency disabled
      expect(chartsResult).toBe(true); // Still enabled
    });
  });
});
