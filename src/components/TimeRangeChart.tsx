import { Component, onMount, onCleanup, createSignal, createMemo } from 'solid-js';
import { Chart, Title, Tooltip, Legend, Colors, LineController, LineElement, PointElement, LinearScale, TimeScale, TimeSeriesScale } from 'chart.js';
import 'chartjs-adapter-date-fns';
import { Line } from 'solid-chartjs';
import { getChartOptions, ValueAxis } from '../lib/chartConfig';
import { ChartDataset } from '../lib/timeRangeCostCalculation';

interface TimeRangeChartProps {
  datasets: ChartDataset[];
  startDate: Date;
  endDate: Date;
}

/** One y axis per unit: the first unit on the left, a second one on the right. */
export function buildValueAxes(datasets: ChartDataset[]): { axes: ValueAxis[]; axisForUnit: Map<string, string> } {
  const units = [...new Set(datasets.map(d => d.unit))];
  const axisForUnit = new Map<string, string>();
  const axes: ValueAxis[] = units.map((unit, i) => {
    const id = i === 0 ? 'y' : `y${i}`;
    axisForUnit.set(unit, id);
    return { id, title: `${unit}/day`, position: i === 0 ? 'left' : 'right' };
  });
  return { axes: axes.length > 0 ? axes : [{ id: 'y', title: '' }], axisForUnit };
}

export function buildTimeRangeChartData(datasets: ChartDataset[]) {
  const { axisForUnit } = buildValueAxes(datasets);
  return {
    datasets: datasets.flatMap(dataset => {
      const yAxisID = axisForUnit.get(dataset.unit) ?? 'y';
      const series = [{
        label: `${dataset.label} (${dataset.unit}/day)`,
        data: dataset.actualPoints,
        borderColor: dataset.borderColor,
        backgroundColor: dataset.borderColor + '20',
        pointRadius: 0,
        borderWidth: 2,
        fill: false,
        spanGaps: false,
        yAxisID,
      }];
      if (dataset.interpolatedLine.length > 0) {
        series.push({
          label: `${dataset.label} (projected)`,
          data: dataset.interpolatedLine,
          borderColor: dataset.borderColor,
          backgroundColor: dataset.borderColor + '10',
          pointRadius: 0,
          borderWidth: 2,
          fill: false,
          spanGaps: false,
          yAxisID,
          borderDash: [5, 5],
        } as typeof series[number]);
      }
      return series;
    }),
  };
}

const TimeRangeChart: Component<TimeRangeChartProps> = (props) => {
  const [isMobile, setIsMobile] = createSignal(window.innerWidth < 768);

  onMount(() => {
    Chart.register(Title, Tooltip, Legend, Colors, LineController, LineElement, PointElement, LinearScale, TimeScale, TimeSeriesScale);

    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    onCleanup(() => window.removeEventListener('resize', handleResize));
  });

  const chartData = createMemo(() => buildTimeRangeChartData(props.datasets));
  const chartOptions = createMemo(() => getChartOptions(isMobile(), buildValueAxes(props.datasets).axes));

  return (
    <div class={`w-full min-w-0 max-w-full overflow-hidden relative ${isMobile() ? 'h-72' : 'h-96'}`}>
      <div class="absolute inset-0">
        <Line data={chartData()} options={chartOptions()} />
      </div>
    </div>
  );
};

export default TimeRangeChart;
