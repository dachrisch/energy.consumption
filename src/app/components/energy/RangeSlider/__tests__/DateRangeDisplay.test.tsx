/**
 * DateRangeDisplay Component Tests
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import DateRangeDisplay from '../DateRangeDisplay';

describe('DateRangeDisplay', () => {
  const startDate = new Date('2024-10-01');
  const endDate = new Date('2024-11-04');

  const defaultProps = {
    startDate,
    endDate,
    startPosition: 100,
    endPosition: 400,
    format: 'full' as const,
    containerWidth: 500,
  };

  it('renders without crashing', () => {
    const { container } = render(<DateRangeDisplay {...defaultProps} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('displays full date format on desktop', () => {
    render(<DateRangeDisplay {...defaultProps} format="full" />);
    const startDates = screen.getAllByText(/October 1, 2024/);
    const endDates = screen.getAllByText(/November 4, 2024/);
    expect(startDates.length).toBeGreaterThan(0);
    expect(endDates.length).toBeGreaterThan(0);
  });

  it('displays short date format on mobile', () => {
    render(<DateRangeDisplay {...defaultProps} format="short" />);
    expect(screen.getByText('10/01')).toBeInTheDocument();
    expect(screen.getByText('11/04')).toBeInTheDocument();
  });

  it('shows only start label when labels overlap', () => {
    const props = {
      ...defaultProps,
      startPosition: 100,
      endPosition: 120, // Gap of 20px (less than MIN_LABEL_GAP of 40px)
    };
    const { container } = render(<DateRangeDisplay {...props} />);
    const visibleLabels = container.querySelectorAll('.absolute.text-foreground-muted');
    // Should show only one visible label when overlapping
    expect(visibleLabels.length).toBe(1);
  });

  it('shows both labels when they do not overlap', () => {
    const props = {
      ...defaultProps,
      startPosition: 100,
      endPosition: 200, // Gap of 100px (more than MIN_LABEL_GAP)
    };
    const { container } = render(<DateRangeDisplay {...props} />);
    const visibleLabels = container.querySelectorAll('.absolute.text-foreground-muted');
    // Should show two visible labels when not overlapping
    expect(visibleLabels.length).toBe(2);
  });

  it('includes screen reader text for accessibility', () => {
    render(<DateRangeDisplay {...defaultProps} />);
    const srText = screen.getByText(/Selected date range:/);
    expect(srText).toHaveClass('sr-only');
  });

  it('positions labels correctly', () => {
    const { container } = render(<DateRangeDisplay {...defaultProps} />);
    const labels = container.querySelectorAll('.absolute');
    expect(labels[0]).toHaveStyle({ left: '100px' });
    expect(labels[1]).toHaveStyle({ left: '400px' });
  });

  it('applies correct font size for full format', () => {
    const { container } = render(<DateRangeDisplay {...defaultProps} format="full" />);
    const label = container.querySelector('.text-foreground-muted') as HTMLElement;
    expect(label).toHaveStyle({ fontSize: '0.875rem' });
  });

  it('applies correct font size for short format', () => {
    const { container } = render(<DateRangeDisplay {...defaultProps} format="short" />);
    const label = container.querySelector('.text-foreground-muted') as HTMLElement;
    expect(label).toHaveStyle({ fontSize: '0.75rem' });
  });

  it('aligns start label left when near left edge', () => {
    const props = {
      ...defaultProps,
      startPosition: 5, // Near left edge
      endPosition: 400,
      containerWidth: 500,
    };
    const { container } = render(<DateRangeDisplay {...props} />);
    const labels = container.querySelectorAll('.absolute.text-foreground-muted');
    // First label should be left-aligned (no center transform)
    expect(labels[0]).toHaveStyle({ left: '10px', transform: 'none' });
  });

  it('aligns end label right when near right edge', () => {
    const props = {
      ...defaultProps,
      startPosition: 100,
      endPosition: 490, // Near right edge
      containerWidth: 500,
    };
    const { container } = render(<DateRangeDisplay {...props} />);
    const labels = container.querySelectorAll('.absolute.text-foreground-muted');
    // Second label should be right-aligned
    expect(labels[1]).toHaveStyle({ right: '10px', left: 'auto', transform: 'none' });
  });

  it('center-aligns labels when not near edges', () => {
    const props = {
      ...defaultProps,
      startPosition: 150,
      endPosition: 350,
      containerWidth: 500,
    };
    const { container } = render(<DateRangeDisplay {...props} />);
    const labels = container.querySelectorAll('.absolute.text-foreground-muted');
    // Both labels should be center-aligned
    expect(labels[0]).toHaveStyle({ left: '150px', transform: 'translateX(-50%)' });
    expect(labels[1]).toHaveStyle({ left: '350px', transform: 'translateX(-50%)' });
  });
});
