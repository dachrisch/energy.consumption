import { Component, onMount, onCleanup, createSignal, createMemo } from 'solid-js';
import { Chart, Title, Tooltip, Legend, Colors, LineController, LineElement, PointElement, LinearScale, TimeScale, TimeSeriesScale } from 'chart.js';
import 'chartjs-adapter-date-fns';
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

interface ChartPoint {
  x: number;
  y: number | null;
}

interface ChartDataset {
  label: string;
  data: ChartPoint[];
  borderColor: string;
  backgroundColor?: string;
  tension: number;
  fill: boolean;
  borderDash?: number[];
  pointRadius?: number;
}

interface ConsumptionChartProps {
  readings: Reading[];
  projection?: ProjectionPoint[];
  unit: string;
}

const transformData = (props: ConsumptionChartProps, isMobile: boolean): { datasets: ChartDataset[] } => {
  const sorted = [...props.readings].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  const actualPoints: ChartPoint[] = sorted.map(r => {
    const time = new Date(r.date).getTime();
    const value = r.value;
    return isMobile ? { x: value, y: time } : { x: time, y: value };
  });

  const datasets: ChartDataset[] = [
    {
      label: `Consumption (${props.unit})`,
      data: actualPoints,
      borderColor: '#9311fb',
      backgroundColor: 'rgba(147, 17, 251, 0.1)',
      tension: 0.4,
      fill: true
    }
  ];

  if (props.projection && props.projection.length > 0) {
    const projectionPoints: ChartPoint[] = props.projection.map(p => {
      const time = new Date(p.date).getTime();
      const value = p.value;
      return isMobile ? { x: value, y: time } : { x: time, y: value };
    });

    datasets.push({
      label: `Projection (365 days)`,
      data: projectionPoints,
      borderColor: '#9311fb',
      borderDash: [5, 5],
      tension: 0.4,
      fill: false,
      pointRadius: 0
    });
  }
  
  return { datasets };
};

const ConsumptionChart: Component<ConsumptionChartProps> = (props) => {
  const [isMobile, setIsMobile] = createSignal(window.innerWidth < 768);

  onMount(() => {
    Chart.register(Title, Tooltip, Legend, Colors, LineController, LineElement, PointElement, LinearScale, TimeScale, TimeSeriesScale);

    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    onCleanup(() => window.removeEventListener('resize', handleResize));
  });

  const chartData = createMemo(() => transformData(props, isMobile()));
  const chartOptions = createMemo(() => getChartOptions(isMobile()));

  return (
    <div class={`w-full min-w-0 max-w-full overflow-hidden transition-all duration-300 relative ${isMobile() ? 'h-[500px]' : 'h-64'}`}>
       {/* Re-render chart when mode changes to ensure full option re-application */}
       <div class="absolute inset-0">
         <Line data={chartData()} options={chartOptions()} />
       </div>
    </div>
  );
};

export default ConsumptionChart;