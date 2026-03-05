import { Component, onMount, onCleanup, createSignal, createMemo } from 'solid-js';
import { Chart, Title, Tooltip, Legend, Colors, LineController, LineElement, PointElement, LinearScale, TimeScale, TimeSeriesScale } from 'chart.js';
import 'chartjs-adapter-date-fns';
import { Line } from 'solid-chartjs';
import { getChartOptions } from '../lib/chartConfig';
import { ChartDataset } from '../lib/timeRangeCostCalculation';

interface TimeRangeChartProps {
  datasets: ChartDataset[];
  startDate: Date;
  endDate: Date;
}

interface ChartDataPoint {
  x: number;
  y: number | null;
}

const TimeRangeChart: Component<TimeRangeChartProps> = (props) => {
  const [isMobile, setIsMobile] = createSignal(window.innerWidth < 768);

  onMount(() => {
    Chart.register(Title, Tooltip, Legend, Colors, LineController, LineElement, PointElement, LinearScale, TimeScale, TimeSeriesScale);

    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    onCleanup(() => window.removeEventListener('resize', handleResize));
  });

  const transformData = createMemo(() => {
    const chartDatasets = props.datasets.map(dataset => [
      // Actual readings as points (with dashed style)
      {
        label: `${dataset.label} (Actual)`,
        data: dataset.actualPoints,
        borderColor: dataset.borderColor,
        backgroundColor: dataset.borderColor + '20',
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: dataset.borderColor,
        tension: 0,
        fill: false,
        borderDash: [0],
        borderWidth: 0,
        showLine: false
      },
      // Interpolated line
      {
        label: `${dataset.label} (Interpolated)`,
        data: dataset.interpolatedLine,
        borderColor: dataset.borderColor,
        backgroundColor: dataset.borderColor + '10',
        pointRadius: 0,
        tension: 0.4,
        fill: false,
        borderDash: [5, 5],
        borderWidth: 2
      }
    ]).flat();

    return { datasets: chartDatasets };
  });

  const chartOptions = createMemo(() => getChartOptions(isMobile()));

  return (
    <div class={`w-full min-w-0 max-w-full overflow-hidden transition-all duration-300 relative ${isMobile() ? 'h-[500px]' : 'h-96'}`}>
      <div class="absolute inset-0">
        <Line data={transformData()} options={chartOptions()} />
      </div>
    </div>
  );
};

export default TimeRangeChart;
