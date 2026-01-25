import { ChartOptions } from 'chart.js';

export const getChartOptions = (isMobile: boolean): ChartOptions => {
  if (isMobile) {
    return {
      indexAxis: 'y', // Swaps X and Y axes
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        x: {
          beginAtZero: false,
          position: 'top', // Optional: put values at top for better visibility
        },
        y: {
          // Inverted time sorting is handled by data sorting, but we might want to reverse axis here if needed
          reverse: true 
        }
      }
    };
  }

  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: false
      }
    }
  };
};
