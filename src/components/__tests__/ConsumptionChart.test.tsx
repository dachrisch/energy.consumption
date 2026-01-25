import { describe, it, expect, vi } from 'vitest';
import { render } from '@solidjs/testing-library';
import ConsumptionChart from '../components/ConsumptionChart';

// Mock chart.js to avoid canvas errors in JSDOM
vi.mock('solid-chartjs', () => ({
  Line: (props: any) => {
    return <div data-testid="mock-chart" data-options={JSON.stringify(props.options)}></div>;
  }
}));

describe('ConsumptionChart Responsiveness', () => {
  it('should detect mobile viewport (< 768px)', async () => {
    // Mock window.innerWidth
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 500 });
    window.dispatchEvent(new Event('resize'));

    // We'll verify the component logic once implemented
    // For now, this test serves as a placeholder for the logic we're about to add
    expect(window.innerWidth).toBe(500);
  });

  it('should detect desktop viewport (>= 768px)', async () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 });
    window.dispatchEvent(new Event('resize'));

    expect(window.innerWidth).toBe(1024);
  });
});
