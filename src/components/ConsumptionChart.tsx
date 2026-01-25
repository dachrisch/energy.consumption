import { Component, onMount, onCleanup, createSignal, createMemo } from 'solid-js';
import { Chart, Title, Tooltip, Legend, Colors, LineController, LineElement, PointElement, LinearScale, CategoryScale } from 'chart.js';
import { Line } from 'solid-chartjs';
import { getChartOptions } from '../lib/chartConfig';

const ConsumptionChart: Component<{ readings: any[], unit: string }> = (props) => {
  const [isMobile, setIsMobile] = createSignal(window.innerWidth < 768);

  onMount(() => {
    Chart.register(Title, Tooltip, Legend, Colors, LineController, LineElement, PointElement, LinearScale, CategoryScale);

    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    onCleanup(() => window.removeEventListener('resize', handleResize));
  });

  const chartData = createMemo(() => {
    // Standard sort: Oldest to Newest
    const sorted = [...props.readings].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // For mobile (inverted), we want Oldest at Top (Y-axis 0).
    // Since Chart.js renders index 0 at the origin, and Y-axis usually goes up:
    // With `indexAxis: 'y'`, the Category scale is on Y.
    // By default, Category scale is top-to-bottom? No, usually bottom-to-top.
    // Let's rely on standard sorting first. 
    // If we use `scales.y.reverse: true` in config, 0 will be at top.
    
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
  });

  const chartOptions = createMemo(() => getChartOptions(isMobile()));

  return (
    <div class="h-64 w-full transition-all duration-300">
       {/* Re-render chart when mode changes to ensure full option re-application */}
       {isMobile() ? (
         <Line data={chartData()} options={chartOptions()} width={500} height={400} />
       ) : (
         <Line data={chartData()} options={chartOptions()} />
       )}
    </div>
  );
};

export default ConsumptionChart;