import { ChartOptions } from 'chart.js';

/** A y axis with its unit label, e.g. { id: 'y', title: 'kWh/day' }. */
export interface ValueAxis {
  id: string;
  title: string;
  position?: 'left' | 'right';
}

const GRID_COLOR = 'rgba(255, 255, 255, 0.05)';
const TICK_COLOR = 'rgba(255, 255, 255, 0.5)';
const TITLE_COLOR = 'rgba(255, 255, 255, 0.6)';

const valueScale = (axis: ValueAxis, isMobile: boolean) => ({
  type: 'linear' as const,
  position: axis.position ?? 'left',
  beginAtZero: true,
  title: { display: true, text: axis.title, color: TITLE_COLOR, font: { size: 11, weight: 'bold' as const } },
  grid: { color: GRID_COLOR, drawOnChartArea: (axis.position ?? 'left') === 'left' },
  ticks: { color: TICK_COLOR, font: { size: 10, weight: 'bold' as const }, maxTicksLimit: isMobile ? 5 : 8 },
});

/**
 * Shared line chart options. Lines never overshoot (monotone interpolation),
 * the legend is shown, and every value axis carries its unit. The same
 * orientation is used on mobile, with fewer ticks.
 */
export const getChartOptions = (isMobile: boolean, axes: ValueAxis[] = [{ id: 'y', title: '' }]): ChartOptions => {
  const scales: Record<string, unknown> = {
    x: {
      type: 'time',
      time: { unit: 'month', displayFormats: { month: isMobile ? 'MMM yy' : 'MMM yyyy' } },
      grid: { color: GRID_COLOR },
      ticks: { color: TICK_COLOR, font: { size: 10, weight: 'bold' }, autoSkip: true, maxRotation: 0, maxTicksLimit: isMobile ? 4 : 10 },
    },
  };
  for (const axis of axes) {
    scales[axis.id] = valueScale(axis, isMobile);
  }

  return {
    responsive: true,
    maintainAspectRatio: false,
    elements: { line: { tension: 0, cubicInterpolationMode: 'monotone' } },
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: { color: TITLE_COLOR, boxWidth: 12, font: { size: 11, weight: 'bold' } },
      },
      tooltip: {
        mode: 'nearest',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        cornerRadius: 12,
      },
    },
    scales: scales as ChartOptions['scales'],
  };
};
