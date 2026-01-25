export interface Reading {
  value: number;
  date: Date;
}

export function calculateDailyAverage(readings: Reading[]): number {
  if (readings.length < 2) return 0;

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
