import { Component, createSignal, createMemo, Show, For } from 'solid-js';
import { IMeter as Meter, IReading as Reading, IContract as Contract } from '../types/models';
import {
  calculateTimeRangeCosts,
  generateChartDataForMeter,
  filterReadingsByDateRange,
  formatCurrency,
  formatDate,
  ChartDataset,
  TimeRangeCostResult
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

interface Preset {
  id: string;
  label: string;
  getRange: (today: Date) => { start: Date; end: Date };
}

const PRESETS: Preset[][] = [
  [
    { id: '7d', label: 'Last 7 days', getRange: (today) => {
      const end = new Date(today); end.setHours(23, 59, 59, 999);
      const start = new Date(end); start.setDate(start.getDate() - 7); start.setHours(0, 0, 0, 0);
      return { start, end };
    }},
    { id: '30d', label: 'Last 30 days', getRange: (today) => {
      const end = new Date(today); end.setHours(23, 59, 59, 999);
      const start = new Date(end); start.setDate(start.getDate() - 30); start.setHours(0, 0, 0, 0);
      return { start, end };
    }},
    { id: '90d', label: 'Last 90 days', getRange: (today) => {
      const end = new Date(today); end.setHours(23, 59, 59, 999);
      const start = new Date(end); start.setDate(start.getDate() - 90); start.setHours(0, 0, 0, 0);
      return { start, end };
    }},
  ],
  [
    { id: 'lastYear', label: 'Last year', getRange: (today) => ({
      start: new Date(today.getFullYear() - 1, 0, 1, 0, 0, 0, 0),
      end: new Date(today.getFullYear() - 1, 11, 31, 23, 59, 59, 999),
    })},
    { id: 'thisYear', label: 'This year', getRange: (today) => ({
      start: new Date(today.getFullYear(), 0, 1, 0, 0, 0, 0),
      end: new Date(today),
    })},
    { id: 'lastMonth', label: 'Last month', getRange: (today) => {
      const end = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);
      const start = new Date(end.getFullYear(), end.getMonth(), 1, 0, 0, 0, 0);
      return { start, end };
    }},
  ],
];

const CostBreakdown: Component<{ result: TimeRangeCostResult }> = (props) => {
  return (
    <div class="space-y-4">
      <h3 class="text-sm font-black uppercase opacity-60">Cost Breakdown</h3>

      {/* Per-Meter Costs */}
      <div class="space-y-2">
        <For each={props.result.meterBreakdowns}>
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
            {formatDate(props.result.startDate)} – {formatDate(props.result.endDate)}
          </p>
        </div>
        <div class="text-right">
          <p class="text-3xl font-black">{formatCurrency(props.result.totalCost)}</p>
        </div>
      </div>
    </div>
  );
};

const CardHeader: Component<{ 
  isOpen: boolean; 
  startDate: Date; 
  endDate: Date; 
  onToggle: () => void 
}> = (props) => (
  <button
    class="w-full flex items-center justify-between p-6 md:p-8 hover:bg-base-200/30 transition-colors text-left"
    onClick={() => props.onToggle()}
  >
    <div>
      <h2 class="text-2xl font-black uppercase">Cost Calculator</h2>
      <p class="text-sm opacity-60 font-bold">
        {props.isOpen ? 'Select a timeframe to analyze costs' : `${formatDate(props.startDate)} – ${formatDate(props.endDate)}`}
      </p>
    </div>
    <Icon
      name="arrow-down"
      class={`h-5 w-5 opacity-60 transition-transform duration-200 ${props.isOpen ? 'rotate-180' : ''}`}
    />
  </button>
);

const Controls: Component<{
  activePreset: string;
  onApplyPreset: (id: string, getRange: (today: Date) => { start: Date; end: Date }) => void;
  startDate: Date;
  endDate: Date;
  onStartDateChange: (date: Date) => void;
  onEndDateChange: (date: Date) => void;
  today: Date;
  meters: Meter[];
  selectedMeterIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
}> = (props) => (
  <div class="space-y-4 mb-6">
    <div class="space-y-2">
      <For each={PRESETS}>
        {(row) => (
          <div class="grid grid-cols-3 gap-2">
            <For each={row}>
              {(preset) => (
                <button
                  class={`btn btn-sm rounded-lg font-bold ${props.activePreset === preset.id ? 'btn-primary' : 'btn-outline opacity-60 hover:opacity-100'}`}
                  onClick={() => props.onApplyPreset(preset.id, preset.getRange)}
                >
                  {preset.label}
                </button>
              )}
            </For>
          </div>
        )}
      </For>
    </div>

    <DateRangePicker
      startDate={props.startDate}
      endDate={props.endDate}
      onStartDateChange={props.onStartDateChange}
      onEndDateChange={props.onEndDateChange}
      maxDate={props.today}
    />

    <MeterMultiSelect
      meters={props.meters}
      selectedMeterIds={props.selectedMeterIds}
      onSelectionChange={props.onSelectionChange}
    />
  </div>
);

const getChartDatasets = (params: {
  meters: Meter[];
  selectedMeterIds: Set<string>;
  readings: Reading[];
  startDate: Date;
  endDate: Date;
  costResult: TimeRangeCostResult | null;
}): ChartDataset[] => {
  const { meters, selectedMeterIds, readings, startDate, endDate, costResult } = params;
  if (!costResult) {
    return [];
  }

  const datasets: ChartDataset[] = [];

  for (const meter of meters) {
    if (!selectedMeterIds.has(meter._id)) {
      continue;
    }

    const allReadings = costResult.allReadingsInRange.get(meter._id);
    if (!allReadings || allReadings.length < 2) {
      continue;
    }

    const rangeReadings = filterReadingsByDateRange(readings, meter._id, startDate, endDate);

    const dataset = generateChartDataForMeter({
      meter,
      allReadings,
      rangeReadings,
      startDate,
      endDate
    });

    if (dataset) {
      datasets.push(dataset);
    }
  }

  return datasets;
};

const ErrorStates: Component<{
  isValidRange: boolean;
  hasSelection: boolean;
}> = (props) => (
  <>
    <Show when={!props.isValidRange}>
      <div class="mb-6 p-4 bg-base-200/50 rounded-xl border border-base-content/10 flex items-center gap-3">
        <Icon name="warning" class="h-5 w-5 opacity-60 flex-shrink-0" />
        <span class="text-sm font-bold opacity-70">Invalid date range</span>
      </div>
    </Show>
    <Show when={props.isValidRange && !props.hasSelection}>
      <div class="mb-6 p-4 bg-base-200/50 rounded-xl border border-base-content/10 flex items-center gap-3">
        <Icon name="info" class="h-5 w-5 opacity-60 flex-shrink-0" />
        <span class="text-sm font-bold opacity-70">Select meters to calculate</span>
      </div>
    </Show>
  </>
);

const EmptyState: Component = () => (
  <div class="text-center py-8 opacity-60">
    <Icon name="info" class="h-8 w-8 mx-auto mb-3 opacity-40" />
    <p class="text-sm font-bold">No readings found for the selected period</p>
  </div>
);

const ChartSection: Component<{
  show: boolean;
  datasets: ChartDataset[];
  startDate: Date;
  endDate: Date;
}> = (props) => (
  <Show when={props.show && props.datasets.length > 0}>
    <div class="mb-8">
      <h3 class="text-sm font-black uppercase opacity-60 mb-4">Consumption History</h3>
      <div class="rounded-2xl bg-base-200/50 p-4 overflow-hidden">
        <TimeRangeChart
          datasets={props.datasets}
          startDate={props.startDate}
          endDate={props.endDate}
        />
      </div>
    </div>
  </Show>
);

const TimeRangeCostCard: Component<TimeRangeCostCardProps> = (props) => {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const [startDate, setStartDate] = createSignal(thirtyDaysAgo);
  const [endDate, setEndDate] = createSignal(today);
  const [activePreset, setActivePreset] = createSignal<string>('30d');

  const applyPreset = (id: string, getRange: (today: Date) => { start: Date; end: Date }) => {
    const { start, end } = getRange(today);
    setStartDate(start);
    setEndDate(end);
    setActivePreset(id);
  };

  const handleManualDateChange = (setter: (d: Date) => void) => (date: Date) => {
    setter(date);
    setActivePreset('');
  };

  const [isOpen, setIsOpen] = createSignal(true);

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

    return calculateTimeRangeCosts({
      meters: props.meters,
      selectedMeterIds: selectedMeterIds(),
      readings: props.readings,
      contracts: props.contracts,
      startDate: startDate(),
      endDate: endDate()
    });
  });

  // Generate chart datasets
  const chartDatasets = createMemo((): ChartDataset[] => 
    getChartDatasets({
      meters: props.meters,
      selectedMeterIds: selectedMeterIds(),
      readings: props.readings,
      startDate: startDate(),
      endDate: endDate(),
      costResult: costResult()
    })
  );



  return (
    <div class="card bg-base-100 shadow-xl border rounded-3xl w-full overflow-hidden">
      <CardHeader 
        isOpen={isOpen()} 
        startDate={startDate()} 
        endDate={endDate()} 
        onToggle={() => setIsOpen(!isOpen())} 
      />

      {/* Accordion Body */}
      <Show when={isOpen()}>
        <div class="px-6 md:px-8 pb-6 md:pb-8">
          <Controls
            activePreset={activePreset()}
            onApplyPreset={applyPreset}
            startDate={startDate()}
            endDate={endDate()}
            onStartDateChange={handleManualDateChange(setStartDate)}
            onEndDateChange={handleManualDateChange(setEndDate)}
            today={today}
            meters={props.meters}
            selectedMeterIds={selectedMeterIds()}
            onSelectionChange={setSelectedMeterIds}
          />

          <ErrorStates
            isValidRange={isValidDateRange()}
            hasSelection={selectedMeterIds().size > 0}
          />

              <ChartSection
            show={!!costResult()}
            datasets={chartDatasets()}
            startDate={startDate()}
            endDate={endDate()}
          />

          <Show when={costResult()}>
            {(result) => <CostBreakdown result={result()} />}
          </Show>

          <Show when={isValidDateRange() && selectedMeterIds().size > 0 && !costResult()}>
            <EmptyState />
          </Show>

        </div>
      </Show>
    </div>
  );
};

export default TimeRangeCostCard;
