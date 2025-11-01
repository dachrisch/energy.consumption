import { renderHook, act } from '@testing-library/react';
import { useTableSort } from '../useTableSort';

describe('useTableSort', () => {
  it('should initialize with provided field and default order', () => {
    const { result } = renderHook(() => useTableSort('date'));

    expect(result.current.sortField).toBe('date');
    expect(result.current.sortOrder).toBe('asc');
  });

  it('should initialize with provided field and custom order', () => {
    const { result } = renderHook(() => useTableSort('amount', 'desc'));

    expect(result.current.sortField).toBe('amount');
    expect(result.current.sortOrder).toBe('desc');
  });

  it('should toggle sort order when clicking same field', () => {
    const { result } = renderHook(() => useTableSort('date', 'asc'));

    expect(result.current.sortOrder).toBe('asc');

    act(() => {
      result.current.handleSort('date');
    });

    expect(result.current.sortOrder).toBe('desc');

    act(() => {
      result.current.handleSort('date');
    });

    expect(result.current.sortOrder).toBe('asc');
  });

  it('should change field and reset to asc when clicking different field', () => {
    const { result } = renderHook(() => useTableSort('date', 'desc'));

    expect(result.current.sortField).toBe('date');
    expect(result.current.sortOrder).toBe('desc');

    act(() => {
      result.current.handleSort('amount');
    });

    expect(result.current.sortField).toBe('amount');
    expect(result.current.sortOrder).toBe('asc');
  });

  it('should return correct sort icon for current field ascending', () => {
    const { result } = renderHook(() => useTableSort('date', 'asc'));

    expect(result.current.getSortIcon('date')).toBe('↑');
    expect(result.current.getSortIcon('amount')).toBeNull();
  });

  it('should return correct sort icon for current field descending', () => {
    const { result } = renderHook(() => useTableSort('date', 'desc'));

    expect(result.current.getSortIcon('date')).toBe('↓');
    expect(result.current.getSortIcon('amount')).toBeNull();
  });

  it('should return null for non-current field', () => {
    const { result } = renderHook(() => useTableSort('date'));

    expect(result.current.getSortIcon('amount')).toBeNull();
    expect(result.current.getSortIcon('type')).toBeNull();
  });

  it('should handle multiple field changes correctly', () => {
    const { result } = renderHook(() => useTableSort('date'));

    // Change to amount
    act(() => {
      result.current.handleSort('amount');
    });
    expect(result.current.sortField).toBe('amount');
    expect(result.current.sortOrder).toBe('asc');

    // Toggle amount
    act(() => {
      result.current.handleSort('amount');
    });
    expect(result.current.sortField).toBe('amount');
    expect(result.current.sortOrder).toBe('desc');

    // Change to type
    act(() => {
      result.current.handleSort('type');
    });
    expect(result.current.sortField).toBe('type');
    expect(result.current.sortOrder).toBe('asc');
  });
});
