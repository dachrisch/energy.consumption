import { Component, onMount, onCleanup, createSignal, createMemo } from 'solid-js';
import { Chart, Title, Tooltip, Legend, Colors, LineController, LineElement, PointElement, LinearScale, TimeScale, TimeSeriesScale, Filler } from 'chart.js';
import 'chartjs-adapter-date-fns';
import { Line } from 'solid-chartjs';
import { getChartOptions } from '../lib/chartConfig';
import { buildDailyRateSeries, buildRateProjection, findMeterChangeDates } from '../lib/consumptionChartData';
import type { ReadingKind } from '../types/models';

interface Reading {
  date: string | Date;
  value: number;
  kind?: ReadingKind;
}

interface ConsumptionChartProps {
  readings: Reading[];
  unit: string;
  /** Days to project the current daily rate forward (0 = no projection). */
  projectionDays?: number;
}

const LINE_COLOR = '#9311fb';
const CHANGE_COLOR = '#f59e0b';

export const buildConsumptionChartData = (props: ConsumptionChartProps) => {
  const readings = props.readings.map(r => ({ value: r.value, date: new Date(r.date), kind: r.kind }));
  const rates = buildDailyRateSeries(readings);
  const projection = buildRateProjection(readings, props.projectionDays ?? 0);
  const changes = findMeterChangeDates(readings).map(date => ({ x: date.getTime(), y: 0 }));
  const unitPerDay = `${props.unit}/day`;

  const datasets: Array<Record<string, unknown>> = [{
    label: `Consumption (${unitPerDay})`,
    data: rates,
    borderColor: LINE_COLOR,
    backgroundColor: 'rgba(147, 17, 251, 0.1)',
    fill: true,
    spanGaps: false,
    pointRadius: 0,
  }];
  if (projection.length > 0) {
    datasets.push({
      label: `Projection (current rate, ${unitPerDay})`,
      data: projection,
      borderColor: LINE_COLOR,
      borderDash: [5, 5],
      fill: false,
      pointRadius: 0,
    });
  }
  if (changes.length > 0) {
    datasets.push({
      label: 'Meter change',
      data: changes,
      borderColor: CHANGE_COLOR,
      backgroundColor: CHANGE_COLOR,
      showLine: false,
      pointStyle: 'triangle',
      pointRadius: 7,
    });
  }
  return { datasets };
};

const ConsumptionChart: Component<ConsumptionChartProps> = (props) => {
  const [isMobile, setIsMobile] = createSignal(window.innerWidth < 768);

  onMount(() => {
    Chart.register(Title, Tooltip, Legend, Colors, LineController, LineElement, PointElement, LinearScale, TimeScale, TimeSeriesScale, Filler);

    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    onCleanup(() => window.removeEventListener('resize', handleResize));
  });

  const chartData = createMemo(() => buildConsumptionChartData(props));
  const chartOptions = createMemo(() => getChartOptions(isMobile(), [{ id: 'y', title: `${props.unit}/day` }]));

  return (
    <div class={`w-full min-w-0 max-w-full overflow-hidden relative ${isMobile() ? 'h-72' : 'h-64'}`}>
      <div class="absolute inset-0">
        <Line data={chartData()} options={chartOptions()} />
      </div>
    </div>
  );
};

export default ConsumptionChart;
