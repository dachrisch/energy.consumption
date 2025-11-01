import { renderHook, waitFor } from '@testing-library/react';
import { useEnergyData } from '../useEnergyData';

// Mock fetch
global.fetch = jest.fn();

describe('useEnergyData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with loading state', () => {
    (global.fetch as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    const { result } = renderHook(() => useEnergyData());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('should fetch and parse energy data successfully', async () => {
    const mockData = [
      {
        _id: '1',
        userId: 'user1',
        type: 'power',
        amount: 1000,
        date: '2024-01-01T00:00:00.000Z',
      },
      {
        _id: '2',
        userId: 'user1',
        type: 'gas',
        amount: 500,
        date: '2024-01-02T00:00:00.000Z',
      },
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const { result } = renderHook(() => useEnergyData());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data[0].date).toBeInstanceOf(Date);
    expect(result.current.data[1].date).toBeInstanceOf(Date);
    expect(result.current.error).toBeNull();
  });

  it('should handle fetch error', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    const { result } = renderHook(() => useEnergyData());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual([]);
    expect(result.current.error).toBe('Failed to fetch energy data');
  });

  it('should handle network error', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error('Network error')
    );

    const { result } = renderHook(() => useEnergyData());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual([]);
    expect(result.current.error).toBe('Network error');
  });

  it('should handle non-Error exceptions', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce('String error');

    const { result } = renderHook(() => useEnergyData());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual([]);
    expect(result.current.error).toBe('Failed to load energy data');
  });

  it('should allow manual refetch', async () => {
    const mockData = [
      {
        _id: '1',
        userId: 'user1',
        type: 'power',
        amount: 1000,
        date: '2024-01-01T00:00:00.000Z',
      },
    ];

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockData,
    });

    const { result } = renderHook(() => useEnergyData());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);

    // Trigger refetch
    result.current.refetch();

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  it('should call correct API endpoint', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    renderHook(() => useEnergyData());

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/energy');
    });
  });

  it('should reset error on refetch', async () => {
    // First call fails
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
    });

    const { result } = renderHook(() => useEnergyData());

    await waitFor(() => {
      expect(result.current.error).not.toBeNull();
    });

    // Second call succeeds
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    result.current.refetch();

    await waitFor(() => {
      expect(result.current.error).toBeNull();
    });
  });
});
