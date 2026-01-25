export interface Reading {
  value: number;
  date: Date;
}

export interface ReadingWithDelta extends Reading {
  delta: number;
}

export function calculateDailyAverage(readings: Reading[]): number {
  if (readings.length < 2) {return 0;}

  // Sort by date ascending
  const sorted = [...readings].sort((a, b) => a.date.getTime() - b.date.getTime());
  
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  
  const consumption = last.value - first.value;
  const msDiff = last.date.getTime() - first.date.getTime();
  const days = msDiff / (1000 * 60 * 60 * 24);
  
  return days > 0 ? consumption / days : 0;
}

export function calculateStats(readings: Reading[]) {
  const dailyAverage = calculateDailyAverage(readings);
  const yearlyProjection = dailyAverage * 365.25;
  
  return {
    dailyAverage,
    yearlyProjection
  };
}

/**
 * Calculates deltas for a list of readings.
 * Assumes readings are for the same meter.
 * Returns readings in descending order (newest first).
 */
export function calculateDeltas(readings: Reading[]): ReadingWithDelta[] {
  if (readings.length === 0) {return [];}
  
  // Sort by date ascending to calculate deltas forward
  const sorted = [...readings].sort((a, b) => a.date.getTime() - b.date.getTime());
  
  const result: ReadingWithDelta[] = sorted.map((r, i) => {
    const prev = sorted[i - 1];
    const delta = prev ? r.value - prev.value : 0;
    return {
      ...r,
      delta
    };
  });
  
  // Return descending (newest first) for UI
  return result.sort((a, b) => b.date.getTime() - a.date.getTime());
}