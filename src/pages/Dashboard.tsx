import { Component, createResource, Show, createSignal, onMount, onCleanup, createMemo } from 'solid-js';
import { A } from '@solidjs/router';
import { IMeter as Meter, IReading as Reading, IContract as Contract } from '../types/models';
import UnifiedImportModal from '../components/UnifiedImportModal';
import EmptyState from '../components/EmptyState';
import { useToast } from '../context/ToastContext';
import { calculateAggregates, DetailedAggregates } from '../lib/aggregates';
import { findContractGaps, Gap } from '../lib/gapDetection';
import { Chart, Title, Tooltip, Legend, Colors, BarElement, CategoryScale, LinearScale, TooltipItem } from 'chart.js';
import { Bar } from 'solid-chartjs';
import Icon from '../components/Icon';

Chart.register(Title, Tooltip, Legend, Colors, BarElement, CategoryScale, LinearScale);

type Aggregates = DetailedAggregates;

const getMeterContracts = (m: Meter, contracts: Contract[]) => contracts.filter(c => (typeof c.meterId === 'string' ? c.meterId : (c.meterId as { _id: string })?._id) === m._id);

const getMetersWithGaps = (meters: Meter[], readings: Reading[], contracts: Contract[], noContracts: Meter[]) => meters.map(m => {
  if (noContracts.some(nm => nm._id === m._id)) {
    return { ...m, gaps: [] as Gap[] };
  }
  return { ...m, gaps: findContractGaps(readings.filter(r => r.meterId === m._id), getMeterContracts(m, contracts)) };
}).filter(m => m.gaps.length > 0);

const fetchDashboardData = async () => {
  const res = await fetch('/api/dashboard');
  if (!res.ok) {
    throw new Error('Failed to fetch');
  }
  return res.json();
};

const DashboardHeader: Component<{ onImport: () => void }> = (p) => (
  <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
    <div><h1 class="text-4xl font-black tracking-tighter">Financial Cockpit</h1><p class="text-base-content/60 font-bold">Aggregated insights.</p></div>
    <div class="flex gap-2"><button class="btn btn-ghost btn-md rounded-2xl" onClick={p.onImport}>Import</button>
      <A href="/add-reading" class="btn btn-primary btn-md rounded-2xl shadow-xl px-8 text-sm"><Icon name="add" class="h-5 w-5" />Quick Add</A></div>
  </div>
);

const TrendValue: Component<{ current: number, previous: number }> = (p) => {
  const diff = () => p.current - p.previous;
  const pct = () => p.previous > 0 ? (diff() / p.previous) * 100 : 0;
  const isUp = () => diff() > 0;
  return (<Show when={p.previous > 0}><div class={`text-[10px] font-black flex items-center gap-1 mt-1 ${isUp() ? 'text-error/80' : 'text-success/90'} overflow-hidden whitespace-nowrap`}>
    <Icon name={isUp() ? 'arrow-up' : 'arrow-down'} class={`h-3 w-3 flex-shrink-0 ${isUp() ? '' : 'rotate-180'}`} />
    <span class="truncate">{isUp() ? '+' : '-'}€{Math.abs(diff()).toFixed(2)} ({Math.abs(pct()).toFixed(1)}%)</span>
  </div></Show>);
};

const getThemeColor = (name: string) => (typeof window === 'undefined') ? '#000' : (getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#000');

const getChartData = (agg: Aggregates) => {
  const pc = getThemeColor('--color-meter-power-chart'); const gc = getThemeColor('--color-meter-gas-chart');
  return {
    labels: agg.yearlyHistory.map(h => h.year.toString()),
    datasets: [
      { label: 'Power (€)', data: agg.yearlyHistory.map(h => h.powerCost), backgroundColor: pc, hoverBackgroundColor: getThemeColor('--color-meter-power'), borderRadius: 4, barPercentage: 0.6, categoryPercentage: 0.8 },
      { label: 'Gas (€)', data: agg.yearlyHistory.map(h => h.gasCost), backgroundColor: gc, hoverBackgroundColor: getThemeColor('--color-meter-gas'), borderRadius: 4, barPercentage: 0.6, categoryPercentage: 0.8 }
    ]
  };
};

const getChartOpts = (isMob: boolean) => ({
  indexAxis: isMob ? 'y' as const : 'x' as const, responsive: true, maintainAspectRatio: false, animation: { duration: 0 },
  plugins: { legend: { display: false }, tooltip: { backgroundColor: '#2b2d42', padding: 12, cornerRadius: 12, callbacks: { label: (c: TooltipItem<'bar'>) => `${c.dataset.label}: ${new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(c.parsed[isMob ? 'x' : 'y'] || 0)}` } } },
  scales: { x: { stacked: true, display: !isMob, grid: { display: false }, border: { display: false }, ticks: { color: 'rgba(255,255,255,0.5)', font: { size: 10, weight: 'bold' } } }, y: { stacked: true, display: isMob, grid: { display: false }, border: { display: false }, ticks: { color: 'rgba(255,255,255,0.5)', font: { size: 10, weight: 'bold' } } } }
});

const DashboardAggregates: Component<{ data: { aggregates: Aggregates, hasPower: boolean, hasGas: boolean } }> = (p) => {
  const [isMob, setIsMob] = createSignal(window.innerWidth < 600);
  onMount(() => { const h = () => setIsMob(window.innerWidth < 600); window.addEventListener('resize', h); onCleanup(() => window.removeEventListener('resize', h)); });
  const cData = createMemo(() => getChartData(p.data.aggregates));
  const cOpts = createMemo(() => getChartOpts(isMob()));
  return (<Show when={p.data.aggregates}><div class="card bg-primary text-primary-content shadow-2xl p-0 rounded-3xl relative overflow-hidden group w-full min-w-0">
    <div class="flex flex-col md:flex-row h-full min-w-0"><div class="p-6 md:p-8 md:w-1/3 relative z-10 border-b md:border-b-0 md:border-r border-white/10 min-w-0">
      <p class="text-[10px] font-black uppercase tracking-[0.2em] opacity-70 mb-2 truncate">Projected Yearly Cost</p>
      <h2 class="text-5xl md:text-6xl font-black tracking-tighter mb-1">€{Math.round(p.data.aggregates.totalYearlyCost || 0)}</h2>
      <TrendValue current={p.data.aggregates.ytdCostCurrent} previous={p.data.aggregates.ytdCostPrevious} />
      <div class="flex gap-6 md:gap-8 mt-8">
        <Show when={p.data.hasPower}><div class="min-w-0"><p class="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Power</p><p class="text-xl font-black">€{Math.round(p.data.aggregates.powerYearlyCost || 0)}</p><TrendValue current={p.data.aggregates.ytdPowerCurrent} previous={p.data.aggregates.ytdPowerPrevious} /></div></Show>
        <Show when={p.data.hasGas}><div class="min-w-0"><p class="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Gas</p><p class="text-xl font-black">€{Math.round(p.data.aggregates.gasYearlyCost || 0)}</p><TrendValue current={p.data.aggregates.ytdGasCurrent} previous={p.data.aggregates.ytdGasPrevious} /></div></Show>
      </div></div>
      <div class={`p-4 md:p-6 flex-1 bg-white/5 relative ${isMob() ? 'h-[250px]' : 'h-48 md:h-auto'} overflow-hidden min-w-0`}><div class="h-full w-full relative"><Bar data={cData()} options={cOpts()} /></div></div>
    </div></div></Show>);
};

const Dashboard: Component = () => {
  const [rawData, { refetch }] = createResource(fetchDashboardData);
  const [isImportOpen, setImportOpen] = createSignal(false);
  const { showToast } = useToast();
    const data = createMemo(() => {
      const d = rawData(); 
      if (!d) {
        return null;
      }
      const { meters, readings, contracts } = d;
   const agg = calculateAggregates(meters, readings, contracts) as Aggregates;
    const noC = meters.filter((m: Meter) => !getMeterContracts(m, contracts).length);
    const gaps = getMetersWithGaps(meters, readings, contracts, noC);
    return { ...d, aggregates: agg, hasPower: meters.some((m: Meter) => m.type === 'power'), hasGas: meters.some((m: Meter) => m.type === 'gas'), hasMeters: meters.length > 0, hasMissingContracts: noC.length > 0, hasPartialGaps: gaps.length > 0, metersWithNoContracts: noC, metersWithPartialGaps: gaps };
  });
  const handleImport = async (iData: { version?: string }) => {
    const isU = typeof iData === 'object' && iData !== null && !Array.isArray(iData) && iData.version === '1.0';
    const res = await fetch(isU ? '/api/import/unified' : '/api/readings/bulk', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(iData) });
    const r = await res.json();
    if (res.ok) {
      showToast(isU ? 'Backup restored' : `Imported ${r.successCount}`, 'success'); refetch();
    } else {
      showToast('Failed', 'error');
    }
  };
  return (<div class="p-4 md:p-10 lg:p-12 max-w-6xl mx-auto space-y-6 md:space-y-10 flex-1 min-w-0 w-full overflow-x-hidden">
    <UnifiedImportModal isOpen={isImportOpen()} onClose={() => setImportOpen(false)} onSave={handleImport} meters={rawData()?.meters || []} onMeterCreated={() => refetch()} />
    <DashboardHeader onImport={() => setImportOpen(true)} />
    <Show when={!rawData.loading} fallback={<div class="flex justify-center py-20"><span class="loading loading-spinner loading-lg text-primary"></span></div>}>
      <div class="flex flex-col gap-6"><div class="w-full"><Show when={data()}>{(d) => <DashboardAggregates data={d} />}</Show></div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch"><Show when={data()}>{( _ ) => <><EmptyState title="Meters" description="Manage infrastructure." actionLabel="Meters" actionLink="/meters" icon={<Icon name="meter" class="h-10 w-10" />} />
          <div class="card bg-base-100 shadow-xl border p-8 rounded-3xl flex flex-col items-center text-center space-y-4 relative"><div class="bg-base-200 p-4 rounded-2xl text-base-content/20"><Icon name="contract" class="h-10 w-10" /></div><h3 class="text-lg font-black uppercase opacity-40">Contracts</h3><p class="text-sm font-bold opacity-60">Manage pricing.</p><A href="/contracts" class="btn btn-outline btn-wide rounded-2xl border-2 font-black">Go to Contracts</A></div></>}</Show></div>
      </div></Show></div>);
};

export default Dashboard;
