import type { Reading } from './consumption';

export interface RatePoint {
  x: number; // timestamp
  y: number | null; // consumption per day; null breaks the line
}

const DAY_MS = 1000 * 60 * 60 * 24;

const sortAscending = (readings: Reading[]): Reading[] =>
  [...readings].sort((a, b) => a.date.getTime() - b.date.getTime());

/**
 * True when the interval ending at `next` has no measurable consumption:
 * a recorded meter change, or an unmarked decrease (data error).
 */
const isBrokenInterval = (prev: Reading, next: Reading): boolean =>
  next.kind === 'meterChange' || next.value < prev.value;

/**
 * Consumption per day between consecutive readings, as a step series.
 * Each valid interval contributes a flat segment (start and end point at the
 * same rate). Intervals across a meter change or a decrease produce a gap
 * (null) instead of a drop to zero or a negative value.
 */
export function buildDailyRateSeries(readings: Reading[], startDate?: Date, endDate?: Date): RatePoint[] {
  const sorted = sortAscending(readings);
  const points: RatePoint[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const next = sorted[i];
    const days = (next.date.getTime() - prev.date.getTime()) / DAY_MS;
    if (days <= 0) { continue; }
    if (startDate && next.date < startDate) { continue; }
    if (endDate && prev.date > endDate) { break; }
    const from = Math.max(prev.date.getTime(), startDate?.getTime() ?? -Infinity);
    const to = Math.min(next.date.getTime(), endDate?.getTime() ?? Infinity);
    if (isBrokenInterval(prev, next)) {
      points.push({ x: from, y: null });
      continue;
    }
    const rate = (next.value - prev.value) / days;
    points.push({ x: from, y: rate }, { x: to, y: rate });
  }
  return points;
}

/** Dates of readings recorded as a meter change (new physical meter). */
export function findMeterChangeDates(readings: Reading[]): Date[] {
  return sortAscending(readings).filter(r => r.kind === 'meterChange').map(r => r.date);
}

/** Average consumption per day within the current (last) physical meter segment. */
export function currentSegmentDailyRate(readings: Reading[]): number {
  const sorted = sortAscending(readings);
  let segmentStart = 0;
  sorted.forEach((r, i) => {
    if (r.kind === 'meterChange') { segmentStart = i; }
  });
  const segment = sorted.slice(segmentStart);
  let total = 0;
  for (let i = 1; i < segment.length; i++) {
    const diff = segment[i].value - segment[i - 1].value;
    if (diff > 0) { total += diff; }
  }
  if (segment.length < 2) { return 0; }
  const days = (segment[segment.length - 1].date.getTime() - segment[0].date.getTime()) / DAY_MS;
  return days > 0 ? total / days : 0;
}

/**
 * Flat projection of the current daily rate from the last reading forward.
 * Returns two points (start, end) or an empty list when there is no rate.
 */
export function buildRateProjection(readings: Reading[], days: number, endDate?: Date): RatePoint[] {
  const sorted = sortAscending(readings);
  if (sorted.length < 2) { return []; }
  const rate = currentSegmentDailyRate(sorted);
  if (rate <= 0) { return []; }
  const start = sorted[sorted.length - 1].date.getTime();
  const end = endDate ? endDate.getTime() : start + days * DAY_MS;
  if (end <= start) { return []; }
  return [{ x: start, y: rate }, { x: end, y: rate }];
}
