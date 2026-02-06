import { Component, createResource, Show, createSignal } from 'solid-js';
import { A } from '@solidjs/router';
import { IMeter as Meter, IReading as Reading, IContract as Contract } from '../types/models';
import UnifiedImportModal from '../components/UnifiedImportModal';
import EmptyState from '../components/EmptyState';
import { useToast } from '../context/ToastContext';
import { calculateAggregates } from '../lib/aggregates';
import { findContractGaps, Gap } from '../lib/gapDetection';

interface Aggregates {
  totalYearlyCost: number;
  powerYearlyCost: number;
  gasYearlyCost: number;
}

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
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 4v16m8-8H4" /></svg>
        Quick Add Reading
      </A>
    </div>
  </div>
);

const DashboardAggregates: Component<{ data: {
  hasMeters: boolean;
  hasPower: boolean;
  hasGas: boolean;
  aggregates: Aggregates;
} }> = (props) => (
  <Show when={props.data.hasMeters}>
    <div class="card bg-primary text-primary-content shadow-2xl p-8 rounded-3xl relative overflow-hidden group">
      <div class="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-700"></div>
      <div class="relative z-10">
        <p class="text-xs font-black uppercase tracking-[0.2em] opacity-70 mb-2">Total Projected Yearly Cost</p>
        <h2 class="text-6xl font-black tracking-tighter mb-6">€{Math.round(props.data.aggregates.totalYearlyCost || 0)}</h2>
        <div class="flex gap-10 pt-6 border-t border-white/10">
          <Show when={props.data.hasPower}>
            <div>
              <p class="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Power</p>
              <p class="text-xl font-black">€{Math.round(props.data.aggregates.powerYearlyCost || 0)}</p>
            </div>
          </Show>
          <Show when={props.data.hasGas}>
            <div>
              <p class="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Gas</p>
              <p class="text-xl font-black">€{Math.round(props.data.aggregates.gasYearlyCost || 0)}</p>
            </div>
          </Show>
        </div>
      </div>
    </div>
  </Show>
);

const DashboardWarnings: Component<{ data: {
  hasMissingContracts: boolean;
  hasPartialGaps: boolean;
  hasMeters: boolean;
} }> = (props) => (
  <>
    <Show when={props.data.hasMeters && props.data.hasMissingContracts}>
      <EmptyState 
        title="No contract on meter"
        description="One or more of your meters have no pricing contracts configured. Add one to see cost projections."
        actionLabel="Add Contract"
        actionLink="/contracts/add"
        compact={true}
        colorScheme="warning"
        icon={<svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
      />
    </Show>

    <Show when={props.data.hasMeters && props.data.hasPartialGaps}>
      <EmptyState 
        title="Partial contracts missing"
        description="We detected gaps in your contract coverage. Fill them to ensure 100% accurate financial history."
        actionLabel="Show Contract Page"
        actionLink="/contracts"
        compact={true}
        icon={<svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-12 0 9 9 0 0112 0z" /></svg>}
      />
    </Show>
  </>
);

const DashboardEmptyState: Component<{ hasMeters: boolean }> = (props) => (
  <>
    <Show when={!props.hasMeters}>
      <EmptyState 
        title="Getting Started"
        description="To begin tracking your energy costs, you first need to register a utility meter."
        actionLabel="Add Meter"
        actionLink="/meters/add"
        colorScheme="primary"
        icon={<svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0112 0z" /></svg>}
      />
    </Show>

    <Show when={props.hasMeters}>
      <div class="card bg-base-100 shadow-xl border border-base-content/5 p-8 rounded-3xl flex flex-col justify-center items-center text-center space-y-4">
         <div class="bg-base-200 p-4 rounded-2xl text-base-content/20">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0112 0z" /></svg>
         </div>
         <h3 class="text-lg font-black tracking-tight uppercase opacity-40">Meter Management</h3>
         <p class="text-sm font-bold text-base-content/60 max-w-xs">
           Manage your individual meters, history and contracts in the new section.
         </p>
         <A href="/meters" class="btn btn-outline btn-wide rounded-2xl border-2">Go to Meters</A>
      </div>
    </Show>
  </>
);

const Dashboard: Component = () => {
  const [data, { refetch }] = createResource(fetchDashboardData);
  const [isImportOpen, setImportOpen] = createSignal(false);
  const { showToast } = useToast();

  const handleBulkImport = async (data: any) => {
    const isUnified = !Array.isArray(data) && data.version === '1.0' && data.data;
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
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DashboardAggregates data={data()} />
          <DashboardWarnings data={data()} />
          <DashboardEmptyState hasMeters={data()?.hasMeters} />
        </div>
      </Show>
    </div>
  );
};

export default Dashboard;