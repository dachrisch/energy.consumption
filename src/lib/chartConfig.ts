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
        },
        tooltip: {
          mode: 'index',
          intersect: false
        }
      },
      scales: {
        x: {
          type: 'linear',
          beginAtZero: false,
          position: 'top',
        },
        y: {
          type: 'time',
          time: {
            unit: 'month',
            displayFormats: {
              month: 'MMM yyyy'
            }
          },
          reverse: true, // Newest at top
          ticks: {
            autoSkip: true,
            maxRotation: 0
          }
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
      },
      tooltip: {
        mode: 'index',
        intersect: false
      }
    },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'month',
          displayFormats: {
            month: 'MMM yyyy'
          }
        },
        ticks: {
          autoSkip: true,
          maxRotation: 0
        }
      },
      y: {
        type: 'linear',
        beginAtZero: false
      }
    }
  };
};
