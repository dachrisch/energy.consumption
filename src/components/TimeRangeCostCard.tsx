import { Component, createSignal, createMemo, Show, For } from 'solid-js';
import { IMeter as Meter, IReading as Reading, IContract as Contract } from '../types/models';
import {
  calculateTimeRangeCosts,
  generateChartDataForMeter,
  filterReadingsByDateRange,
  formatCurrency,
  formatDate,
  ChartDataset
} from '../lib/timeRangeCostCalculation';
import TimeRangeChart from './TimeRangeChart';
import MeterMultiSelect from './MeterMultiSelect';
import DateRangePicker from './DateRangePicker';
import Icon from './Icon';

interface TimeRangeCostCardProps {
  meters: Meter[];
  readings: Reading[];
  contracts: Contract[];
}

const TimeRangeCostCard: Component<TimeRangeCostCardProps> = (props) => {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const [startDate, setStartDate] = createSignal(thirtyDaysAgo);
  const [endDate, setEndDate] = createSignal(today);
  const [activePreset, setActivePreset] = createSignal<string>('30d');

  const presets: { id: string; label: string; getRange: () => { start: Date; end: Date } }[][] = [
    [
      { id: '7d', label: 'Last 7 days', getRange: () => {
        const end = new Date(today); end.setHours(23, 59, 59, 999);
        const start = new Date(end); start.setDate(start.getDate() - 7); start.setHours(0, 0, 0, 0);
        return { start, end };
      }},
      { id: '30d', label: 'Last 30 days', getRange: () => {
        const end = new Date(today); end.setHours(23, 59, 59, 999);
        const start = new Date(end); start.setDate(start.getDate() - 30); start.setHours(0, 0, 0, 0);
        return { start, end };
      }},
      { id: '90d', label: 'Last 90 days', getRange: () => {
        const end = new Date(today); end.setHours(23, 59, 59, 999);
        const start = new Date(end); start.setDate(start.getDate() - 90); start.setHours(0, 0, 0, 0);
        return { start, end };
      }},
    ],
    [
      { id: 'lastYear', label: 'Last year', getRange: () => ({
        start: new Date(today.getFullYear() - 1, 0, 1, 0, 0, 0, 0),
        end: new Date(today.getFullYear() - 1, 11, 31, 23, 59, 59, 999),
      })},
      { id: 'thisYear', label: 'This year', getRange: () => ({
        start: new Date(today.getFullYear(), 0, 1, 0, 0, 0, 0),
        end: new Date(today),
      })},
      { id: 'lastMonth', label: 'Last month', getRange: () => {
        const end = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);
        const start = new Date(end.getFullYear(), end.getMonth(), 1, 0, 0, 0, 0);
        return { start, end };
      }},
    ],
  ];

  const applyPreset = (id: string, getRange: () => { start: Date; end: Date }) => {
    const { start, end } = getRange();
    setStartDate(start);
    setEndDate(end);
    setActivePreset(id);
  };

  const handleManualDateChange = (setter: (d: Date) => void) => (date: Date) => {
    setter(date);
    setActivePreset('');
  };
  const [selectedMeterIds, setSelectedMeterIds] = createSignal<Set<string>>(
    new Set(props.meters.map(m => m._id))
  );

  // Validate date range
  const isValidDateRange = () => {
    const start = startDate();
    const end = endDate();
    return start <= end && start <= today && end <= today;
  };

  // Calculate costs for the selected range
  const costResult = createMemo(() => {
    if (!isValidDateRange() || selectedMeterIds().size === 0) {
      return null;
    }

    return calculateTimeRangeCosts(
      props.meters,
      selectedMeterIds(),
      props.readings,
      props.contracts,
      startDate(),
      endDate()
    );
  });

  // Generate chart datasets
  const chartDatasets = createMemo((): ChartDataset[] => {
    if (!costResult()) {
      return [];
    }

    const result = costResult()!;
    const datasets: ChartDataset[] = [];

    for (const meter of props.meters) {
      if (!selectedMeterIds().has(meter._id)) {
        continue;
      }

      const allReadings = result.allReadingsInRange.get(meter._id);
      if (!allReadings || allReadings.length < 2) {
        continue;
      }

      const rangeReadings = filterReadingsByDateRange(
        props.readings,
        meter._id,
        startDate(),
        endDate()
      );

      const dataset = generateChartDataForMeter(
        meter,
        allReadings,
        rangeReadings,
        startDate(),
        endDate()
      );

      if (dataset) {
        datasets.push(dataset);
      }
    }

    return datasets;
  });



  return (
    <div class="card bg-base-100 shadow-xl border p-6 md:p-8 rounded-3xl w-full">
      {/* Header */}
      <div class="flex items-center gap-3 mb-6">
        <div class="bg-primary/10 p-3 rounded-2xl">
          <Icon name="calendar" class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 class="text-2xl font-black uppercase">Cost Calculator</h2>
          <p class="text-sm opacity-60 font-bold">Select a timeframe to analyze costs</p>
        </div>
      </div>

      {/* Controls */}
      <div class="space-y-4 mb-6">
        {/* Presets */}
        <div class="space-y-2">
          <For each={presets}>
            {(row) => (
              <div class="grid grid-cols-3 gap-2">
                <For each={row}>
                  {(preset) => (
                    <button
                      class={`btn btn-sm rounded-lg font-bold ${activePreset() === preset.id ? 'btn-primary' : 'btn-outline opacity-60 hover:opacity-100'}`}
                      onClick={() => applyPreset(preset.id, preset.getRange)}
                    >
                      {preset.label}
                    </button>
                  )}
                </For>
              </div>
            )}
          </For>
        </div>

        {/* Date Range Picker */}
        <DateRangePicker
          startDate={startDate()}
          endDate={endDate()}
          onStartDateChange={handleManualDateChange(setStartDate)}
          onEndDateChange={handleManualDateChange(setEndDate)}
          maxDate={today}
        />

        {/* Meter Selection */}
        <MeterMultiSelect
          meters={props.meters}
          selectedMeterIds={selectedMeterIds()}
          onSelectionChange={setSelectedMeterIds}
        />
      </div>

      {/* Error States */}
      <Show when={!isValidDateRange()}>
        <div class="mb-6 p-4 bg-base-200/50 rounded-xl border border-base-content/10 flex items-center gap-3">
          <Icon name="warning" class="h-5 w-5 opacity-60 flex-shrink-0" />
          <span class="text-sm font-bold opacity-70">Invalid date range</span>
        </div>
      </Show>

      <Show when={isValidDateRange() && selectedMeterIds().size === 0}>
        <div class="mb-6 p-4 bg-base-200/50 rounded-xl border border-base-content/10 flex items-center gap-3">
          <Icon name="info" class="h-5 w-5 opacity-60 flex-shrink-0" />
          <span class="text-sm font-bold opacity-70">Select meters to calculate</span>
        </div>
      </Show>

      {/* Chart */}
      <Show when={costResult() && chartDatasets().length > 0}>
        <div class="mb-8">
          <h3 class="text-sm font-black uppercase opacity-60 mb-4">Consumption History</h3>
          <div class="rounded-2xl bg-base-200/50 p-4 overflow-hidden">
            <TimeRangeChart
              datasets={chartDatasets()}
              startDate={startDate()}
              endDate={endDate()}
            />
          </div>
        </div>
      </Show>

      {/* Cost Breakdown */}
      <Show when={costResult()}>
        {(result) => (
          <div class="space-y-4">
            <h3 class="text-sm font-black uppercase opacity-60">Cost Breakdown</h3>

            {/* Per-Meter Costs */}
            <div class="space-y-2">
              <For each={result().meterBreakdowns}>
                {(breakdown) => (
                  <div class="flex items-center justify-between p-4 bg-base-200/50 rounded-xl">
                    <div class="flex-1 min-w-0">
                      <p class="font-bold text-sm">{breakdown.meterName}</p>
                      <p class="text-xs opacity-60">
                        {breakdown.consumption.toFixed(2)} {breakdown.unit}
                      </p>
                    </div>
                    <div class="text-right font-black">
                      <p class="text-lg">{formatCurrency(breakdown.cost)}</p>
                    </div>
                  </div>
                )}
              </For>
            </div>

            {/* Total Cost */}
            <div class="divider my-2" />
            <div class="flex items-center justify-between p-4 bg-primary/10 rounded-xl border border-primary/20">
              <div class="flex-1">
                <p class="text-xs font-black uppercase tracking-widest opacity-60">Total Cost</p>
                <p class="text-xs opacity-60 mt-1">
                  {formatDate(result().startDate)} – {formatDate(result().endDate)}
                </p>
              </div>
              <div class="text-right">
                <p class="text-3xl font-black">{formatCurrency(result().totalCost)}</p>
              </div>
            </div>
          </div>
        )}
      </Show>

      {/* Empty State */}
      <Show when={isValidDateRange() && selectedMeterIds().size > 0 && !costResult()}>
        <div class="text-center py-8 opacity-60">
          <Icon name="info" class="h-8 w-8 mx-auto mb-3 opacity-40" />
          <p class="text-sm font-bold">No readings found for the selected period</p>
        </div>
      </Show>
    </div>
  );
};

export default TimeRangeCostCard;
