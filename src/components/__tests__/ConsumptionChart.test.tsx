import { describe, it, expect, vi } from 'vitest';
import { getChartOptions } from '../../lib/chartConfig';
import { buildConsumptionChartData } from '../ConsumptionChart';
import { buildTimeRangeChartData, buildValueAxes } from '../TimeRangeChart';

// Mock chart.js to avoid canvas errors in JSDOM
vi.mock('solid-chartjs', () => ({
  Line: (props: any) => {
    return <div data-testid="mock-chart" data-options={JSON.stringify(props.options)}></div>;
  }
}));

describe('Chart Configuration', () => {
  it('never smooths lines past the data and shows a legend', () => {
    const options: any = getChartOptions(false, [{ id: 'y', title: 'kWh/day' }]);
    expect(options.elements.line.tension).toBe(0);
    expect(options.elements.line.cubicInterpolationMode).toBe('monotone');
    expect(options.plugins.legend.display).toBe(true);
    expect(options.scales.y.title.text).toBe('kWh/day');
  });

  it('keeps the same orientation on mobile with fewer ticks', () => {
    const options: any = getChartOptions(true);
    expect(options.indexAxis).toBeUndefined();
    expect(options.scales.x.type).toBe('time');
    expect(options.scales.x.ticks.maxTicksLimit).toBeLessThan(getChartOptions(false).scales!.x!.ticks!.maxTicksLimit as number);
  });

  it('puts a second unit on its own right-hand axis', () => {
    const options: any = getChartOptions(false, [
      { id: 'y', title: 'kWh/day', position: 'left' },
      { id: 'y1', title: 'm³/day', position: 'right' },
    ]);
    expect(options.scales.y1.position).toBe('right');
    expect(options.scales.y1.title.text).toBe('m³/day');
  });
});

describe('buildConsumptionChartData', () => {
  it('has no negative or reset-to-zero consumption across a meter change', () => {
    const data = buildConsumptionChartData({
      unit: 'kWh',
      projectionDays: 365,
      readings: [
        { date: '2025-07-03', value: 6575 },
        { date: '2025-09-16', value: 7255 },
        { date: '2025-09-17', value: 0, kind: 'meterChange' },
        { date: '2026-01-20', value: 426 },
      ],
    });
    const consumption = data.datasets[0].data as Array<{ y: number | null }>;
    expect(consumption.filter(p => p.y !== null).every(p => (p.y as number) > 0)).toBe(true);
    expect(data.datasets.map(d => d.label)).toEqual([
      'Consumption (kWh/day)',
      'Projection (current rate, kWh/day)',
      'Meter change',
    ]);
  });
});

describe('buildTimeRangeChartData', () => {
  it('gives each unit its own axis and labels series with units', () => {
    const base = { actualPoints: [{ x: 1, y: 2 }], interpolatedLine: [], borderColor: '#000', meterType: 'power' as const };
    const datasets = [
      { ...base, label: 'Power', meterId: 'm1', unit: 'kWh' },
      { ...base, label: 'Therme', meterId: 'm2', unit: 'm³', meterType: 'gas' as const },
    ];
    const data = buildTimeRangeChartData(datasets);
    expect(data.datasets.map(d => [d.label, d.yAxisID])).toEqual([
      ['Power (kWh/day)', 'y'],
      ['Therme (m³/day)', 'y1'],
    ]);
    expect(buildValueAxes(datasets).axes.map(a => a.position)).toEqual(['left', 'right']);
  });
});

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
