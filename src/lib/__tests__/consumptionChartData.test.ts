import { describe, expect, it } from 'vitest';
import {
  buildDailyRateSeries,
  buildRateProjection,
  currentSegmentDailyRate,
  findMeterChangeDates,
} from '../consumptionChartData';
import type { Reading } from '../consumption';

const d = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

// Real shape of the "2. OG links" power meter around its replacement
const meterChangeFixture: Reading[] = [
  { date: d('2025-07-03'), value: 6575, kind: 'regular' },
  { date: d('2025-09-16'), value: 7255, kind: 'regular' },
  { date: d('2025-09-17'), value: 0, kind: 'meterChange' },
  { date: d('2026-01-20'), value: 426, kind: 'regular' },
];

describe('buildDailyRateSeries', () => {
  it('turns intervals into flat per-day steps', () => {
    const series = buildDailyRateSeries([
      { date: d('2026-01-01'), value: 100 },
      { date: d('2026-01-11'), value: 200 },
    ]);
    expect(series).toEqual([
      { x: d('2026-01-01').getTime(), y: 10 },
      { x: d('2026-01-11').getTime(), y: 10 },
    ]);
  });

  it('never yields a negative or reset-to-zero point across a meter change', () => {
    const series = buildDailyRateSeries(meterChangeFixture);
    const values = series.map(p => p.y).filter((y): y is number => y !== null);
    expect(values.every(v => v > 0)).toBe(true);
    // the interval ending at the meter change is a gap, not a drop
    expect(series).toContainEqual({ x: d('2025-09-16').getTime(), y: null });
    // old meter: 680 kWh over 75 days; new meter: 426 kWh over 125 days
    expect(series[0].y).toBeCloseTo(680 / 75, 5);
    expect(series[series.length - 1].y).toBeCloseTo(426 / 125, 5);
  });

  it('breaks the line at an unmarked decrease instead of drawing it', () => {
    const series = buildDailyRateSeries([
      { date: d('2023-09-15'), value: 4698 },
      { date: d('2023-11-30'), value: 4051.5 },
      { date: d('2023-12-15'), value: 4914 },
    ]);
    expect(series[0]).toEqual({ x: d('2023-09-15').getTime(), y: null });
    expect(series.slice(1).every(p => (p.y ?? 0) > 0)).toBe(true);
  });

  it('clips steps to the requested range', () => {
    const series = buildDailyRateSeries(
      [
        { date: d('2026-01-01'), value: 0 },
        { date: d('2026-01-31'), value: 300 },
      ],
      d('2026-01-11'),
      d('2026-01-21'),
    );
    expect(series).toEqual([
      { x: d('2026-01-11').getTime(), y: 10 },
      { x: d('2026-01-21').getTime(), y: 10 },
    ]);
  });
});

describe('meter change helpers', () => {
  it('finds meter change dates', () => {
    expect(findMeterChangeDates(meterChangeFixture)).toEqual([d('2025-09-17')]);
  });

  it('uses only the current meter segment for the daily rate and projection', () => {
    expect(currentSegmentDailyRate(meterChangeFixture)).toBeCloseTo(426 / 125, 5);
    const projection = buildRateProjection(meterChangeFixture, 365);
    expect(projection).toHaveLength(2);
    expect(projection[0].x).toBe(d('2026-01-20').getTime());
    expect(projection.every(p => p.y !== null && p.y > 0)).toBe(true);
  });
});
