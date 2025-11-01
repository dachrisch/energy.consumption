import { renderHook } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useAuthRedirect } from '../useAuthRedirect';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock next-auth/react
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

describe('useAuthRedirect', () => {
  const mockPush = jest.fn();
  const mockRouter = { push: mockPush };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  it('should redirect to login when unauthenticated', () => {
    (useSession as jest.Mock).mockReturnValue({
      status: 'unauthenticated',
    });

    renderHook(() => useAuthRedirect());

    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('should redirect to custom path when provided', () => {
    (useSession as jest.Mock).mockReturnValue({
      status: 'unauthenticated',
    });

    renderHook(() => useAuthRedirect('/custom-login'));

    expect(mockPush).toHaveBeenCalledWith('/custom-login');
  });

  it('should not redirect when authenticated', () => {
    (useSession as jest.Mock).mockReturnValue({
      status: 'authenticated',
    });

    const { result } = renderHook(() => useAuthRedirect());

    expect(mockPush).not.toHaveBeenCalled();
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });

  it('should not redirect when loading', () => {
    (useSession as jest.Mock).mockReturnValue({
      status: 'loading',
    });

    const { result } = renderHook(() => useAuthRedirect());

    expect(mockPush).not.toHaveBeenCalled();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(true);
  });

  it('should return correct authentication status', () => {
    (useSession as jest.Mock).mockReturnValue({
      status: 'authenticated',
    });

    const { result } = renderHook(() => useAuthRedirect());

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });

  it('should return loading status correctly', () => {
    (useSession as jest.Mock).mockReturnValue({
      status: 'loading',
    });

    const { result } = renderHook(() => useAuthRedirect());

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(true);
  });
});
