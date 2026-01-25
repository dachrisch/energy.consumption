import { Component, onMount } from 'solid-js';
import { Chart, Title, Tooltip, Legend, Colors, LineController, LineElement, PointElement, LinearScale, CategoryScale } from 'chart.js';
import { Line } from 'solid-chartjs';

const ConsumptionChart: Component<{ readings: any[], unit: string }> = (props) => {
  onMount(() => {
    Chart.register(Title, Tooltip, Legend, Colors, LineController, LineElement, PointElement, LinearScale, CategoryScale);
  });

  const chartData = () => {
    const sorted = [...props.readings].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return {
      labels: sorted.map(r => new Date(r.date).toLocaleDateString()),
      datasets: [
        {
          label: `Consumption (${props.unit})`,
          data: sorted.map(r => r.value),
          borderColor: '#9311fb',
          backgroundColor: 'rgba(147, 17, 251, 0.1)',
          tension: 0.4,
          fill: true
        }
      ]
    };
  };

  const chartOptions = {
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

  return (
    <div class="h-64 w-full">
      <Line data={chartData()} options={chartOptions} />
    </div>
  );
};

export default ConsumptionChart;
