import { describe, it, expect } from 'vitest';
import {
  calculateConsumptionBetween,
  calculateDeltas,
  interpolateValueAtDate,
  type Reading,
} from '../consumption';

const powerMeterFixture: Reading[] = [
  { date: new Date('2021-12-31'), value: 2.852 },
  { date: new Date('2022-11-21'), value: 3877.3 },
  { date: new Date('2022-11-23'), value: 3883.4 },
  { date: new Date('2023-02-24'), value: 4161.6 },
  { date: new Date('2023-09-15'), value: 4698 },
  { date: new Date('2023-11-30'), value: 4051.5 },
  { date: new Date('2023-12-15'), value: 4914 },
  { date: new Date('2023-12-16'), value: 4974 },
  { date: new Date('2024-02-09'), value: 5912 },
  { date: new Date('2025-01-03'), value: 6511 },
  { date: new Date('2025-03-31'), value: 6511 },
  { date: new Date('2025-07-03'), value: 6575 },
  { date: new Date('2025-09-16'), value: 7255 },
  { date: new Date('2025-09-17'), value: 0, kind: 'meterChange' },
  { date: new Date('2026-01-20'), value: 426 },
  { date: new Date('2026-03-20'), value: 690 },
  { date: new Date('2026-03-25'), value: 708 },
  { date: new Date('2026-03-30'), value: 729 },
  { date: new Date('2026-04-21'), value: 771 },
  { date: new Date('2026-04-30'), value: 824 },
];

const byDate = (readings: Reading[], date: string) =>
  readings.find(reading => reading.date.toISOString().slice(0, 10) === date);

describe('Consumption Logic', () => {
  it('calculates deltas correctly between readings', () => {
    const readings = [
      { value: 100, date: new Date('2026-01-01') },
      { value: 150, date: new Date('2026-01-05') },
      { value: 210, date: new Date('2026-01-10') },
    ];

    const result = calculateDeltas(readings);

    expect(result).toHaveLength(3);
    expect(result[0].value).toBe(210);
    expect(result[0].delta).toBe(60);
    expect(result[1].value).toBe(150);
    expect(result[1].delta).toBe(50);
    expect(result[2].value).toBe(100);
    expect(result[2].delta).toBe(0);
    expect(result[2].isFirst).toBe(true);
    expect(result[0].isFirst).toBe(false);
  });

  it('distinguishes first, equal, anomalous, and meter-change readings in the real fixture', () => {
    const result = calculateDeltas(powerMeterFixture);

    expect(byDate(result, '2021-12-31')).toMatchObject({ delta: 0, isFirst: true });
    expect(byDate(result, '2025-03-31')).toMatchObject({ delta: 0, isFirst: false });
    expect(byDate(result, '2025-03-31')?.anomaly).toBeUndefined();
    expect(byDate(result, '2023-11-30')).toMatchObject({ delta: 0, anomaly: 'decrease' });
    expect(byDate(result, '2023-12-15')).toMatchObject({ delta: 862.5 });
    expect(byDate(result, '2023-12-15')?.anomaly).toBeUndefined();
    expect(byDate(result, '2025-09-17')).toMatchObject({ delta: 0, kind: 'meterChange' });
    expect(byDate(result, '2025-09-17')?.anomaly).toBeUndefined();
    expect(byDate(result, '2026-01-20')?.delta).toBe(426);
  });

  it('starts a new segment at a meter change even when its value is higher', () => {
    const result = calculateDeltas([
      { date: new Date('2026-01-01'), value: 100 },
      { date: new Date('2026-01-02'), value: 1000, kind: 'meterChange' },
      { date: new Date('2026-01-03'), value: 1100 },
    ]);

    expect(result[1].delta).toBe(0);
    expect(result[0].delta).toBe(100);
  });

  it('clears stale delta metadata when readings are recalculated', () => {
    const [result] = calculateDeltas([
      { date: new Date('2026-01-01'), value: 100, delta: 50, anomaly: 'decrease' },
    ]);

    expect(result.delta).toBe(0);
    expect(result.anomaly).toBeUndefined();
  });

  it('sums consumption per segment for the requested real-data range', () => {
    const consumption = calculateConsumptionBetween(
      powerMeterFixture,
      new Date('2025-07-03'),
      new Date('2026-01-20'),
    );

    expect(consumption).toBe((7255 - 6575) + 426);
  });
});

describe('interpolateValueAtDate', () => {
  it('interpolates correctly between two readings', () => {
    const readings = [
      { date: new Date('2025-01-01'), value: 100 },
      { date: new Date('2025-01-11'), value: 200 },
    ];
    expect(interpolateValueAtDate(new Date('2025-01-06'), readings)).toBe(150);
  });

  it('returns exact value if date matches reading', () => {
    const readings = [
      { date: new Date('2025-01-01'), value: 100 },
      { date: new Date('2025-01-11'), value: 200 },
    ];
    expect(interpolateValueAtDate(new Date('2025-01-11'), readings)).toBe(200);
  });

  it('returns null if date is out of range', () => {
    const readings = [
      { date: new Date('2025-01-01'), value: 100 },
      { date: new Date('2025-01-11'), value: 200 },
    ];
    expect(interpolateValueAtDate(new Date('2024-12-31'), readings)).toBeNull();
  });

  it('never interpolates across a meter-change boundary', () => {
    const readings: Reading[] = [
      { date: new Date('2025-09-16'), value: 7255 },
      { date: new Date('2025-09-17'), value: 0, kind: 'meterChange' },
      { date: new Date('2025-09-27'), value: 100 },
    ];

    expect(interpolateValueAtDate(new Date('2025-09-16T12:00:00Z'), readings)).toBeNull();
    expect(interpolateValueAtDate(new Date('2025-09-17'), readings)).toBe(0);
    expect(interpolateValueAtDate(new Date('2025-09-22'), readings)).toBe(50);
  });
});
