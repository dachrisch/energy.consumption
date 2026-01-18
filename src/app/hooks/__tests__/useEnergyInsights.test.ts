import { renderHook, waitFor } from '@testing-library/react';
import { useEnergyInsights } from '../useEnergyInsights';
import * as projectionsActions from '@/actions/projections';

// Mock fetch
global.fetch = jest.fn();

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: { user: { id: 'user1' } },
    status: 'authenticated',
  }),
}));

// Mock server actions
jest.mock('@/actions/projections', () => ({
  getProjectionsAction: jest.fn(),
}));

describe('useEnergyInsights', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with loading state', () => {
    (global.fetch as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );
    (projectionsActions.getProjectionsAction as jest.Mock).mockImplementation(
      () => new Promise(() => {})
    );

    const currentYear = new Date().getFullYear();
    const { result } = renderHook(() => useEnergyInsights('power', currentYear));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should fetch and combine history and projections successfully', async () => {
    const currentYear = new Date().getFullYear();
    const mockHistoryData = {
      success: true,
      data: {
        data: [
          { month: 1, monthLabel: 'Jan', consumption: 300, isActual: true, isDerived: false },
          { month: 2, monthLabel: 'Feb', consumption: 280, isActual: true, isDerived: false },
        ],
      }
    };

    const mockProjectionsData = {
      monthlyData: [
        { month: 0, actual: 300, projected: 310 },
        { month: 1, actual: 280, projected: 290 },
        { month: 2, actual: null, projected: 305 },
        { month: 3, actual: null, projected: 305 },
        { month: 4, actual: null, projected: 305 },
        { month: 5, actual: null, projected: 305 },
        { month: 6, actual: null, projected: 305 },
        { month: 7, actual: null, projected: 305 },
        { month: 8, actual: null, projected: 305 },
        { month: 9, actual: null, projected: 305 },
        { month: 10, actual: null, projected: 305 },
        { month: 11, actual: null, projected: 305 },
      ],
      currentMonth: { actual: 0, projected: 305, estimatedTotal: 305, estimatedCost: 100, daysRemaining: 15 },
      year: { actualToDate: 580, projectedRemainder: 3000, estimatedTotal: 3580, estimatedCost: 1200 }
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockHistoryData,
    });

    (projectionsActions.getProjectionsAction as jest.Mock).mockResolvedValueOnce(mockProjectionsData);

    const { result } = renderHook(() => useEnergyInsights('power', currentYear));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    }, { timeout: 3000 });

    expect(result.current.error).toBeNull();
    expect(result.current.data).not.toBeNull();
    if (result.current.data) {
      expect(result.current.data.points.length).toBe(12);
      expect(result.current.data.energyType).toBe('power');
      
      const actualPoints = result.current.data.points.filter(p => p.type === 'actual');
      const projectedPoints = result.current.data.points.filter(p => p.type === 'projected');
      
      expect(actualPoints.length).toBeGreaterThan(0);
      expect(projectedPoints.length).toBeGreaterThan(0);
    }
  });

  it('should handle errors from either endpoint', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ message: 'API Error' })
    });
    (projectionsActions.getProjectionsAction as jest.Mock).mockResolvedValueOnce({
      monthlyData: [],
      currentMonth: {},
      year: {}
    });

    const currentYear = new Date().getFullYear();
    const { result } = renderHook(() => useEnergyInsights('power', currentYear));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    }, { timeout: 3000 });

    expect(result.current.error).not.toBeNull();
  });
});
