import { renderHook, act } from '@testing-library/react';
import { useToast } from '../useToast';

describe('useToast', () => {
  it('should initialize with no toast', () => {
    const { result } = renderHook(() => useToast());

    expect(result.current.toast).toBeNull();
  });

  it('should show success toast', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showSuccess('Success message');
    });

    expect(result.current.toast).toEqual({
      message: 'Success message',
      type: 'success',
    });
  });

  it('should show error toast', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showError('Error message');
    });

    expect(result.current.toast).toEqual({
      message: 'Error message',
      type: 'error',
    });
  });

  it('should show info toast', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showInfo('Info message');
    });

    expect(result.current.toast).toEqual({
      message: 'Info message',
      type: 'info',
    });
  });

  it('should show generic toast with custom type', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showToast('Custom message', 'error');
    });

    expect(result.current.toast).toEqual({
      message: 'Custom message',
      type: 'error',
    });
  });

  it('should hide toast', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showSuccess('Success message');
    });

    expect(result.current.toast).not.toBeNull();

    act(() => {
      result.current.hideToast();
    });

    expect(result.current.toast).toBeNull();
  });

  it('should replace existing toast with new one', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showSuccess('First message');
    });

    expect(result.current.toast?.message).toBe('First message');

    act(() => {
      result.current.showError('Second message');
    });

    expect(result.current.toast).toEqual({
      message: 'Second message',
      type: 'error',
    });
  });

  it('should maintain referential stability for callback functions', () => {
    const { result, rerender } = renderHook(() => useToast());

    const firstShowSuccess = result.current.showSuccess;
    const firstHideToast = result.current.hideToast;

    rerender();

    expect(result.current.showSuccess).toBe(firstShowSuccess);
    expect(result.current.hideToast).toBe(firstHideToast);
  });
});
