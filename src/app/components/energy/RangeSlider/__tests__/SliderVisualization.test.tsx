/**
 * SliderVisualization Component Tests
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import SliderVisualization from '../SliderVisualization';
import { HistogramData } from '../types';

describe('SliderVisualization', () => {
  const mockHistogramData: HistogramData = {
    buckets: [
      {
        startDate: new Date('2024-10-01'),
        endDate: new Date('2024-10-07'),
        count: 10,
      },
      {
        startDate: new Date('2024-10-08'),
        endDate: new Date('2024-10-14'),
        count: 15,
      },
      {
        startDate: new Date('2024-10-15'),
        endDate: new Date('2024-10-21'),
        count: 8,
      },
    ],
    maxCount: 15,
    isEmpty: false,
  };

  const defaultProps = {
    histogramData: mockHistogramData,
    width: 800,
    height: 120,
  };

  it('renders without crashing', () => {
    const { container } = render(<SliderVisualization {...defaultProps} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders SVG element', () => {
    const { container } = render(<SliderVisualization {...defaultProps} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('renders correct number of histogram bars', () => {
    const { container } = render(<SliderVisualization {...defaultProps} />);
    const bars = container.querySelectorAll('rect[fill^="rgba(124, 58, 237"]');
    expect(bars.length).toBe(3); // 3 buckets
  });

  it('displays empty state when no data', () => {
    const emptyData: HistogramData = {
      buckets: [],
      maxCount: 0,
      isEmpty: true,
    };
    render(<SliderVisualization {...defaultProps} histogramData={emptyData} />);
    expect(screen.getByText('No measurements available')).toBeInTheDocument();
  });

  it('sets correct SVG dimensions', () => {
    const { container } = render(<SliderVisualization {...defaultProps} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '800');
    expect(svg).toHaveAttribute('height', '120');
  });

  it('includes ARIA label for accessibility', () => {
    const { container } = render(<SliderVisualization {...defaultProps} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('role', 'img');
    expect(svg).toHaveAttribute('aria-label');
  });

  it('applies custom className', () => {
    const { container } = render(
      <SliderVisualization {...defaultProps} className="custom-class" />
    );
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('custom-class');
  });

  it('includes tooltips on bars', () => {
    const { container } = render(<SliderVisualization {...defaultProps} />);
    const titles = container.querySelectorAll('title');
    expect(titles.length).toBe(3);
    expect(titles[0].textContent).toContain('10 measurements');
  });

  it('handles single bucket correctly', () => {
    const singleBucketData: HistogramData = {
      buckets: [
        {
          startDate: new Date('2024-10-01'),
          endDate: new Date('2024-10-07'),
          count: 5,
        },
      ],
      maxCount: 5,
      isEmpty: false,
    };
    const { container } = render(
      <SliderVisualization {...defaultProps} histogramData={singleBucketData} />
    );
    const bars = container.querySelectorAll('rect[fill^="rgba(124, 58, 237"]');
    expect(bars.length).toBe(1);
  });
});
