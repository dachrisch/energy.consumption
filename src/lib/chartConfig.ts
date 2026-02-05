import { ChartOptions } from 'chart.js';

export const getChartOptions = (isMobile: boolean): ChartOptions => {
  if (isMobile) {
    return {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleFont: { weight: 'bold' },
          padding: 12,
          cornerRadius: 12
        }
      },
      scales: {
        x: {
          type: 'linear',
          position: 'bottom',
          grid: {
            color: 'rgba(255, 255, 255, 0.05)',
          },
          ticks: {
            color: 'rgba(255, 255, 255, 0.4)',
            font: { size: 10, weight: 'bold' }
          }
        },
        y: {
          type: 'time',
          time: {
            unit: 'month',
            displayFormats: {
              month: 'MMM yy',
              day: 'dd MMM'
            }
          },
          reverse: false, // Newer dates at the top (timestamp increases upwards)
          grid: {
            color: 'rgba(255, 255, 255, 0.05)',
          },
          ticks: {
            color: 'rgba(255, 255, 255, 0.6)',
            font: { size: 10, weight: 'bold' },
            autoSkip: true,
            maxTicksLimit: 10
          }
        }
      }
    };
  }

  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        cornerRadius: 12
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
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.4)',
          font: { size: 10, weight: 'bold' },
          autoSkip: true,
          maxRotation: 0
        }
      },
      y: {
        type: 'linear',
        beginAtZero: false,
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.4)',
          font: { size: 10, weight: 'bold' }
        }
      }
    }
  };
};
