import { render, screen } from '@testing-library/react';
import Toast from '../Toast';
import { ToastMessage } from '../../types';

describe('Toast', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should render toast message', () => {
    const onClose = jest.fn();
    const toast: ToastMessage = { message: 'Test message', type: 'success' };

    render(<Toast {...toast} onClose={onClose} />);

    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('should call onClose after 3 seconds', () => {
    const onClose = jest.fn();
    const toast: ToastMessage = { message: 'Test message', type: 'success' };

    render(<Toast {...toast} onClose={onClose} />);

    expect(onClose).not.toHaveBeenCalled();

    jest.advanceTimersByTime(3000);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when close button is clicked', () => {
    const onClose = jest.fn();
    const toast: ToastMessage = { message: 'Test message', type: 'success' };

    render(<Toast {...toast} onClose={onClose} />);

    const closeButton = screen.getByText('×');
    closeButton.click();

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should apply success styling', () => {
    const onClose = jest.fn();
    const toast: ToastMessage = { message: 'Success!', type: 'success' };

    const { container } = render(<Toast {...toast} onClose={onClose} />);

    const toastElement = container.querySelector('.bg-green-100');
    expect(toastElement).toBeInTheDocument();
    expect(toastElement).toHaveClass('text-green-800');
  });

  it('should apply error styling', () => {
    const onClose = jest.fn();
    const toast: ToastMessage = { message: 'Error!', type: 'error' };

    const { container } = render(<Toast {...toast} onClose={onClose} />);

    const toastElement = container.querySelector('.bg-red-100');
    expect(toastElement).toBeInTheDocument();
    expect(toastElement).toHaveClass('text-red-800');
  });

  it('should apply info styling', () => {
    const onClose = jest.fn();
    const toast: ToastMessage = { message: 'Info!', type: 'info' };

    const { container } = render(<Toast {...toast} onClose={onClose} />);

    const toastElement = container.querySelector('.bg-blue-100');
    expect(toastElement).toBeInTheDocument();
    expect(toastElement).toHaveClass('text-blue-800');
  });

  it('should clear timeout when unmounted', () => {
    const onClose = jest.fn();
    const toast: ToastMessage = { message: 'Test message', type: 'success' };

    const { unmount } = render(<Toast {...toast} onClose={onClose} />);

    unmount();

    jest.advanceTimersByTime(3000);

    expect(onClose).not.toHaveBeenCalled();
  });

  it('should be positioned at bottom right', () => {
    const onClose = jest.fn();
    const toast: ToastMessage = { message: 'Test message', type: 'success' };

    const { container } = render(<Toast {...toast} onClose={onClose} />);

    const toastElement = container.querySelector('.fixed.bottom-4.right-4');
    expect(toastElement).toBeInTheDocument();
  });

  it('should have shadow and rounded corners', () => {
    const onClose = jest.fn();
    const toast: ToastMessage = { message: 'Test message', type: 'success' };

    const { container } = render(<Toast {...toast} onClose={onClose} />);

    const toastElement = container.querySelector('.shadow-lg.rounded-lg');
    expect(toastElement).toBeInTheDocument();
  });

  it('should display close button with hover effect', () => {
    const onClose = jest.fn();
    const toast: ToastMessage = { message: 'Test message', type: 'success' };

    render(<Toast {...toast} onClose={onClose} />);

    const closeButton = screen.getByText('×');
    expect(closeButton).toHaveClass('text-current', 'hover:text-opacity-75', 'focus:outline-none');
  });

  it('should apply default styling for unknown type', () => {
    const onClose = jest.fn();
    // @ts-expect-error - Testing invalid type
    const toast: ToastMessage = { message: 'Unknown!', type: 'unknown' };

    const { container } = render(<Toast {...toast} onClose={onClose} />);

    const toastElement = container.querySelector('.bg-gray-100');
    expect(toastElement).toBeInTheDocument();
    expect(toastElement).toHaveClass('text-gray-800');
  });
});
