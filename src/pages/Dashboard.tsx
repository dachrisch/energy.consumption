import { Component, createResource, Show, createSignal } from 'solid-js';
import { A } from '@solidjs/router';
import { IMeter as Meter, IReading as Reading, IContract as Contract } from '../types/models';
import UnifiedImportModal from '../components/UnifiedImportModal';
import EmptyState from '../components/EmptyState';
import { useToast } from '../context/ToastContext';
import { calculateAggregates, DetailedAggregates } from '../lib/aggregates';
import { findContractGaps, Gap } from '../lib/gapDetection';
import { Chart, Title, Tooltip, Legend, Colors, BarElement, CategoryScale, LinearScale } from 'chart.js';
import { Bar } from 'solid-chartjs';
import { TooltipItem } from 'chart.js';
import Icon from '../components/Icon';

Chart.register(Title, Tooltip, Legend, Colors, BarElement, CategoryScale, LinearScale);

type Aggregates = DetailedAggregates;

const getMeterContracts = (m: Meter, contracts: Contract[]) => {
  return contracts.filter((c) => {
    const cId = typeof c.meterId === 'string' ? c.meterId : (c.meterId as unknown as { _id: string })?._id;
    return cId === m._id;
  });
};

const getMetersWithGaps = (meters: Meter[], readings: Reading[], contracts: Contract[], metersWithNoContracts: Meter[]) => {
  return meters.map((m) => {
    if (metersWithNoContracts.some((nm) => nm._id === m._id)) {return { ...m, gaps: [] as Gap[] };}
    const meterReadings = readings.filter((r) => r.meterId === m._id);
    const meterContracts = getMeterContracts(m, contracts);
    return { ...m, gaps: findContractGaps(meterReadings, meterContracts) };
  }).filter((m) => m.gaps.length > 0);
};

const fetchDashboardData = async () => {
  const res = await fetch('/api/dashboard');
  if (!res.ok) {throw new Error('Failed to fetch dashboard data');}
  const data = await res.json();
  const { meters, readings, contracts } = data;
  
  const aggregates = calculateAggregates(meters, readings, contracts) as Aggregates;
  const metersWithNoContracts = meters.filter((m: Meter) => !getMeterContracts(m, contracts).length);
  const metersWithPartialGaps = getMetersWithGaps(meters, readings, contracts, metersWithNoContracts);

  return { 
    ...data, 
    aggregates, 
    hasPower: meters.some((m: Meter) => m.type === 'power'), 
    hasGas: meters.some((m: Meter) => m.type === 'gas'), 
    hasMeters: meters.length > 0,
    hasMissingContracts: metersWithNoContracts.length > 0,
    hasPartialGaps: metersWithPartialGaps.length > 0,
    metersWithNoContracts,
    metersWithPartialGaps
  };
};

const DashboardHeader: Component<{ onImportClick: () => void }> = (props) => (
  <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
    <div>
      <h1 class="text-4xl font-black tracking-tighter">Financial Cockpit</h1>
      <p class="text-base-content/60 font-bold">Aggregated insights across all your energy sources.</p>
    </div>
    <div class="flex gap-2">
        <button class="btn btn-ghost btn-md rounded-2xl" onClick={props.onImportClick}>
          Import
        </button>
       <A href="/add-reading" class="btn btn-primary btn-md rounded-2xl shadow-xl shadow-primary/20 px-8 text-sm">
        <Icon name="add" class="h-5 w-5" />
        Quick Add Reading
      </A>
    </div>
  </div>
);

const TrendValue: Component<{ current: number, previous: number, showValue?: boolean }> = (props) => {
    const diff = () => props.current - props.previous;
    const percent = () => props.previous > 0 ? (diff() / props.previous) * 100 : 0;
    const isUp = () => diff() > 0;
    
    return (
        <Show when={props.previous > 0}>
            <div class={`text-[10px] font-black flex items-center gap-1 mt-1 ${isUp() ? 'text-error/80' : 'text-success/90'}`}>
                <Icon name={isUp() ? 'arrow-up' : 'arrow-down'} class={`h-3 w-3 ${isUp() ? '' : 'rotate-180'}`} />
                <span>
                    {isUp() ? '+' : '-'}€{Math.abs(diff()).toFixed(2)} ({Math.abs(percent()).toFixed(1)}%)
                </span>
            </div>
        </Show>
    );
};

const DashboardAggregates: Component<{ data: {
  hasMeters: boolean;
  hasPower: boolean;
  hasGas: boolean;
  aggregates: Aggregates;
} }> = (props) => {
    const chartData = () => ({
        labels: props.data.aggregates.yearlyHistory.map(h => h.year.toString()),
        datasets: [
            {
                label: 'Power (€)',
                data: props.data.aggregates.yearlyHistory.map(h => h.powerCost),
                backgroundColor: '#facc15', // Golden
                hoverBackgroundColor: '#facc15',
                borderRadius: 4,
                borderSkipped: false,
                barPercentage: 0.6,
                categoryPercentage: 0.8
            },
            {
                label: 'Gas (€)',
                data: props.data.aggregates.yearlyHistory.map(h => h.gasCost),
                backgroundColor: '#9311fb', // Using brand primary for gas/secondary
                hoverBackgroundColor: '#9311fb',
                borderRadius: 4,
                borderSkipped: false,
                barPercentage: 0.6,
                categoryPercentage: 0.8
            }
        ]
    });

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 0 },
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#2b2d42',
                titleFont: { weight: 'bold' },
                padding: 12,
                cornerRadius: 12,
                displayColors: true,
                callbacks: {
                    label: (context: TooltipItem<'bar'>) => {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed.y !== null) {
                            label += new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(context.parsed.y);
                        }
                        return label;
                    }
                }
            }
        },
        scales: {
            x: { 
                stacked: true,
                display: true,
                grid: { display: false },
                border: { display: false },
                ticks: { color: 'rgba(255, 255, 255, 0.5)', font: { size: 10, weight: 'bold' } }
            },
            y: { 
                stacked: true,
                display: false
            }
        }
    };

    return (
        <Show when={props.data.hasMeters}>
            <div class="card bg-primary text-primary-content shadow-2xl p-0 rounded-3xl relative overflow-hidden group">
                <div class="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-700"></div>
                <div class="flex flex-col md:flex-row h-full">
                    <div class="p-8 md:w-1/3 relative z-10 border-b md:border-b-0 md:border-r border-white/10">
                        <p class="text-[10px] font-black uppercase tracking-[0.2em] opacity-70 mb-2">Total Projected Yearly Cost</p>
                        <h2 class="text-6xl font-black tracking-tighter mb-1">€{Math.round(props.data.aggregates.totalYearlyCost || 0)}</h2>
                        <TrendValue current={props.data.aggregates.ytdCostCurrent} previous={props.data.aggregates.ytdCostPrevious} />
                        
                        <div class="flex gap-8 mt-8">
                            <Show when={props.data.hasPower}>
                                <div>
                                    <p class="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Power</p>
                                    <p class="text-xl font-black">€{Math.round(props.data.aggregates.powerYearlyCost || 0)}</p>
                                    <TrendValue current={props.data.aggregates.ytdPowerCurrent} previous={props.data.aggregates.ytdPowerPrevious} />
                                </div>
                            </Show>
                            <Show when={props.data.hasGas}>
                                <div>
                                    <p class="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Gas</p>
                                    <p class="text-xl font-black">€{Math.round(props.data.aggregates.gasYearlyCost || 0)}</p>
                                    <TrendValue current={props.data.aggregates.ytdGasCurrent} previous={props.data.aggregates.ytdGasPrevious} />
                                </div>
                            </Show>
                        </div>
                    </div>
                    <div class="p-6 flex-1 bg-white/5 relative h-48 md:h-auto">
                        <div class="h-full w-full">
                             <Bar data={chartData()} options={chartOptions} />
                        </div>
                    </div>
                </div>
            </div>
        </Show>
    );
};

const DashboardWarnings: Component<{ data: {
  hasMissingContracts: boolean;
  hasPartialGaps: boolean;
  hasMeters: boolean;
} }> = (props) => {
  return (
    <div class="card bg-base-100 shadow-xl border border-base-content/5 p-8 rounded-3xl flex flex-col justify-center items-center text-center space-y-4 h-full relative group">
        <Show when={props.data.hasMissingContracts || props.data.hasPartialGaps}>
            <div class="absolute top-4 right-4">
                <div class="tooltip tooltip-left before:text-xs" data-tip="Coverage gaps detected">
                    <span class="relative flex h-3 w-3">
                        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-warning opacity-75"></span>
                        <span class="relative inline-flex rounded-full h-3 w-3 bg-warning"></span>
                    </span>
                </div>
            </div>
        </Show>
        <div class="bg-base-200 p-4 rounded-2xl text-base-content/20">
            <Icon name="contract" class="h-10 w-10" />
        </div>
        <h3 class="text-lg font-black tracking-tight uppercase opacity-40">Contract Management</h3>
        <p class="text-sm font-bold text-base-content/60 max-w-xs">
            Manage your energy provider pricing, active contracts and historical gaps.
        </p>
        <A href="/contracts" class="btn btn-outline btn-wide rounded-2xl border-2 font-black">Go to Contracts</A>
    </div>
  );
};

const DashboardEmptyState: Component<{ hasMeters: boolean }> = (props) => {
  return (
  <>
    <Show when={!props.hasMeters}>
      <EmptyState 
        title="Getting Started"
        description="To begin tracking your energy costs, you first need to register a utility meter."
        actionLabel="Add Meter"
        actionLink="/meters/add"
        colorScheme="primary"
        icon={<Icon name="warning" class="h-10 w-10" />}
      />
    </Show>

    <Show when={props.hasMeters}>
      <div class="card bg-base-100 shadow-xl border border-base-content/5 p-8 rounded-3xl flex flex-col justify-center items-center text-center space-y-4 h-full">
         <div class="bg-base-200 p-4 rounded-2xl text-base-content/20">
            <Icon name="meter" class="h-10 w-10" />
         </div>
         <h3 class="text-lg font-black tracking-tight uppercase opacity-40">Meter Management</h3>
         <p class="text-sm font-bold text-base-content/60 max-w-xs">
           Manage your individual meters, history and infrastructure in the new section.
         </p>
         <A href="/meters" class="btn btn-outline btn-wide rounded-2xl border-2 font-black">Go to Meters</A>
      </div>
    </Show>
  </>
  );
};

const Dashboard: Component = () => {
  const [data, { refetch }] = createResource(fetchDashboardData);
  const [isImportOpen, setImportOpen] = createSignal(false);
  const { showToast } = useToast();

  const handleBulkImport = async (data: unknown) => {
    const isUnified = (
      typeof data === 'object' &&
      data !== null &&
      !Array.isArray(data) &&
      'version' in data &&
      data.version === '1.0' &&
      'data' in data
    );
    const endpoint = isUnified ? '/api/import/unified' : '/api/readings/bulk';

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    const result = await res.json();
    if (res.ok) {
        if (isUnified) {
          showToast(`Backup restored: ${result.metersCreated} meters, ${result.successCount} readings, ${result.contractsCreated} contracts.`, 'success');
        } else {
          showToast(`Imported ${result.successCount} readings. Skipped ${result.skippedCount}.`, 'success');
        }
        refetch();
    } else {
        showToast('Failed to import readings', 'error');
    }
  };

  return (
    <div class="p-4 md:p-10 lg:p-12 max-w-6xl mx-auto space-y-6 md:space-y-10 flex-1 min-w-0">
       <UnifiedImportModal 
            isOpen={isImportOpen()} 
            onClose={() => setImportOpen(false)} 
            onSave={handleBulkImport}
            meters={data.latest?.meters || []}
            onMeterCreated={() => refetch()}
        />
      
      <DashboardHeader onImportClick={() => setImportOpen(true)} />

      <Show when={!data.loading} fallback={<div class="flex justify-center py-20"><span class="loading loading-spinner loading-lg text-primary"></span></div>}>
        <div class="flex flex-col gap-6">
          <div class="w-full">
            <DashboardAggregates data={data()} />
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            <DashboardEmptyState hasMeters={data()?.hasMeters} />
            <DashboardWarnings data={data()} />
          </div>
        </div>
      </Show>
    </div>
  );
};

export default Dashboard;
