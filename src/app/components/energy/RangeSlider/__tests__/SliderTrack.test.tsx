/**
 * SliderTrack Component Tests
 */

import React from 'react';
import { render } from '@testing-library/react';
import SliderTrack from '../SliderTrack';

describe('SliderTrack', () => {
  const defaultProps = {
    startPosition: 100,
    endPosition: 300,
    width: 500,
  };

  it('renders without crashing', () => {
    const { container } = render(<SliderTrack {...defaultProps} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders selected range between handles', () => {
    const { container } = render(<SliderTrack {...defaultProps} />);
    const selectedRange = container.querySelector('.bg-primary');
    expect(selectedRange).toBeInTheDocument();
  });

  it('renders unselected range before start handle', () => {
    const { container } = render(<SliderTrack {...defaultProps} />);
    const unselectedRanges = container.querySelectorAll('.bg-border');
    expect(unselectedRanges.length).toBeGreaterThan(0);
  });

  it('calculates correct selected range width', () => {
    const { container } = render(<SliderTrack {...defaultProps} />);
    const selectedRange = container.querySelector('.bg-primary') as HTMLElement;
    expect(selectedRange).toHaveStyle({ width: '200px' }); // 300 - 100
  });

  it('positions selected range correctly', () => {
    const { container } = render(<SliderTrack {...defaultProps} />);
    const selectedRange = container.querySelector('.bg-primary') as HTMLElement;
    expect(selectedRange).toHaveStyle({ left: '100px' });
  });

  it('handles zero-width selected range', () => {
    const props = {
      startPosition: 200,
      endPosition: 200,
      width: 500,
    };
    const { container } = render(<SliderTrack {...props} />);
    const selectedRange = container.querySelector('.bg-primary') as HTMLElement;
    expect(selectedRange).toHaveStyle({ width: '0px' });
  });

  it('applies custom className', () => {
    const { container } = render(
      <SliderTrack {...defaultProps} className="custom-class" />
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
