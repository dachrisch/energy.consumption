import { renderHook, act } from '@testing-library/react';
import { useConfirmationModal } from '../useConfirmationModal';

describe('useConfirmationModal', () => {
  it('should initialize with modal closed and no data', () => {
    const { result } = renderHook(() => useConfirmationModal());

    expect(result.current.isOpen).toBe(false);
    expect(result.current.pendingData).toBeNull();
  });

  it('should open modal without data', () => {
    const { result } = renderHook(() => useConfirmationModal());

    act(() => {
      result.current.show();
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.pendingData).toBeNull();
  });

  it('should open modal with data', () => {
    const { result } = renderHook(() => useConfirmationModal<string>());
    const testData = 'test data';

    act(() => {
      result.current.show(testData);
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.pendingData).toBe(testData);
  });

  it('should close modal with hide', () => {
    const { result } = renderHook(() => useConfirmationModal());

    act(() => {
      result.current.show();
    });

    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.hide();
    });

    expect(result.current.isOpen).toBe(false);
  });

  it('should cancel modal and clear data', () => {
    const { result } = renderHook(() => useConfirmationModal<string>());
    const testData = 'test data';

    act(() => {
      result.current.show(testData);
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.pendingData).toBe(testData);

    act(() => {
      result.current.cancel();
    });

    expect(result.current.isOpen).toBe(false);
    expect(result.current.pendingData).toBeNull();
  });

  it('should call callback with pending data on confirm', () => {
    const { result } = renderHook(() => useConfirmationModal<number>());
    const testData = 42;
    const mockCallback = jest.fn();

    act(() => {
      result.current.show(testData);
    });

    act(() => {
      result.current.confirm(mockCallback);
    });

    expect(mockCallback).toHaveBeenCalledWith(testData);
    expect(result.current.isOpen).toBe(false);
    expect(result.current.pendingData).toBeNull();
  });

  it('should call callback with null when no pending data', () => {
    const { result } = renderHook(() => useConfirmationModal());
    const mockCallback = jest.fn();

    act(() => {
      result.current.show();
    });

    act(() => {
      result.current.confirm(mockCallback);
    });

    expect(mockCallback).toHaveBeenCalledWith(null);
    expect(result.current.isOpen).toBe(false);
  });

  it('should handle complex object data', () => {
    interface TestData {
      id: number;
      name: string;
    }

    const { result } = renderHook(() => useConfirmationModal<TestData>());
    const testData: TestData = { id: 1, name: 'Test' };
    const mockCallback = jest.fn();

    act(() => {
      result.current.show(testData);
    });

    expect(result.current.pendingData).toEqual(testData);

    act(() => {
      result.current.confirm(mockCallback);
    });

    expect(mockCallback).toHaveBeenCalledWith(testData);
  });

  it('should update pending data on subsequent shows', () => {
    const { result } = renderHook(() => useConfirmationModal<string>());

    act(() => {
      result.current.show('first');
    });
    expect(result.current.pendingData).toBe('first');

    act(() => {
      result.current.show('second');
    });
    expect(result.current.pendingData).toBe('second');
  });
});
