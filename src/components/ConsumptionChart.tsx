import { Component, onMount, onCleanup, createSignal, createMemo } from 'solid-js';
import { Chart, Title, Tooltip, Legend, Colors, LineController, LineElement, PointElement, LinearScale, CategoryScale } from 'chart.js';
import { Line } from 'solid-chartjs';
import { getChartOptions } from '../lib/chartConfig';

interface Reading {
  date: string | Date;
  value: number;
}

interface ProjectionPoint {
  date: string | Date;
  value: number;
}

interface ChartDataset {
  label: string;
  data: (number | null)[];
  borderColor: string;
  backgroundColor?: string;
  tension: number;
  fill: boolean;
  borderDash?: number[];
  pointRadius?: number;
}

const ConsumptionChart: Component<{ readings: Reading[], projection?: ProjectionPoint[], unit: string }> = (props) => {
  const [isMobile, setIsMobile] = createSignal(window.innerWidth < 768);

  onMount(() => {
    Chart.register(Title, Tooltip, Legend, Colors, LineController, LineElement, PointElement, LinearScale, CategoryScale);

    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    onCleanup(() => window.removeEventListener('resize', handleResize));
  });

  const chartData = createMemo(() => {
    const sorted = [...props.readings].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const labels = sorted.map(r => new Date(r.date).toLocaleDateString());
    const values = sorted.map(r => r.value);

    const datasets: ChartDataset[] = [
      {
        label: `Consumption (${props.unit})`,
        data: values,
        borderColor: '#9311fb',
        backgroundColor: 'rgba(147, 17, 251, 0.1)',
        tension: 0.4,
        fill: true
      }
    ];

    if (props.projection && props.projection.length > 0) {
      // We need to merge labels if projection extends beyond
      const projLabels = props.projection.map(p => new Date(p.date).toLocaleDateString());
      
      // Create a combined label set
      const allLabels = [...labels];
      projLabels.forEach(l => {
        if (!allLabels.includes(l)) {
          allLabels.push(l);
        }
      });

      // Align projection data to allLabels
      const projData = allLabels.map(l => {
        const pPoint = props.projection?.find(p => new Date(p.date).toLocaleDateString() === l);
        return pPoint ? pPoint.value : null;
      });

      datasets.push({
        label: `Projection (365 days)`,
        data: projData,
        borderColor: '#9311fb',
        borderDash: [5, 5],
        tension: 0.4,
        fill: false,
        pointRadius: 0 // Hide points for projection
      });

      return {
        labels: allLabels,
        datasets
      };
    }
    
    return {
      labels,
      datasets
    };
  });

  const chartOptions = createMemo(() => getChartOptions(isMobile()));

  return (
    <div class="h-64 w-full min-w-0 max-w-full overflow-hidden transition-all duration-300 relative">
       {/* Re-render chart when mode changes to ensure full option re-application */}
       <div class="absolute inset-0">
         {isMobile() ? (
           <Line data={chartData()} options={chartOptions()} />
         ) : (
           <Line data={chartData()} options={chartOptions()} />
         )}
       </div>
    </div>
  );
};

export default ConsumptionChart;