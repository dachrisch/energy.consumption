import { Component, createResource, Show, createSignal } from 'solid-js';
import { A } from '@solidjs/router';
import CsvImportModal from '../components/CsvImportModal';
import { useToast } from '../context/ToastContext';
import { calculateAggregates } from '../lib/aggregates';
import { findContractGaps, Gap } from '../lib/gapDetection';

interface Meter {
  _id: string;
  type: string;
}

interface Reading {
  meterId: string;
  date: string | Date;
  value: number;
}

interface Contract {
  meterId: string | { _id: string };
}

interface Aggregates {
  totalYearlyCost: number;
  powerYearlyCost: number;
  gasYearlyCost: number;
}

const fetchDashboardData = async () => {
  const res = await fetch('/api/dashboard');
  if (!res.ok) {throw new Error('Failed to fetch dashboard data');}
  const data = await res.json();
  
  const aggregates = calculateAggregates(data.meters, data.readings, data.contracts) as Aggregates;
  
  const hasPower = data.meters.some((m: Meter) => m.type === 'power');
  const hasGas = data.meters.some((m: Meter) => m.type === 'gas');
  
  const metersWithNoContracts = data.meters.filter((m: Meter) => 
    !data.contracts.some((c: Contract) => {
      const cId = typeof c.meterId === 'string' ? c.meterId : c.meterId?._id;
      return cId === m._id;
    })
  );

  const metersWithPartialGaps = data.meters.map((m: Meter) => {
    // Only check for gaps if they HAVE at least one contract (otherwise they are in the 'no contracts' list)
    if (metersWithNoContracts.some((nm: Meter) => nm._id === m._id)) {return { ...m, gaps: [] as Gap[] };}
    
    const meterReadings = data.readings.filter((r: Reading) => r.meterId === m._id);
    const meterContracts = data.contracts.filter((c: Contract) => {
      const cId = typeof c.meterId === 'string' ? c.meterId : c.meterId?._id;
      return cId === m._id;
    });
    const gaps = findContractGaps(meterReadings, meterContracts);
    return { ...m, gaps };
  }).filter((m: { gaps: Gap[] }) => m.gaps.length > 0);

  return { 
    ...data, 
    aggregates, 
    hasPower, 
    hasGas, 
    hasMeters: data.meters.length > 0,
    hasMissingContracts: metersWithNoContracts.length > 0,
    hasPartialGaps: metersWithPartialGaps.length > 0,
    metersWithNoContracts,
    metersWithPartialGaps
  };
};

const Dashboard: Component = () => {
  const [data, { refetch }] = createResource(fetchDashboardData);
  const [isImportOpen, setImportOpen] = createSignal(false);
  const { showToast } = useToast();

  const handleBulkImport = async (readings: Reading[]) => {
    const res = await fetch('/api/readings/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(readings)
    });
    
    const result = await res.json();
    if (res.ok) {
        showToast(`Imported ${result.successCount} readings. Skipped ${result.skippedCount}.`, 'success');
        refetch();
    } else {
        showToast('Failed to import readings', 'error');
    }
  };

  return (
    <div class="p-4 md:p-10 lg:p-12 max-w-6xl mx-auto space-y-6 md:space-y-10 flex-1 min-w-0">
      <CsvImportModal 
          isOpen={isImportOpen()} 
          onClose={() => setImportOpen(false)} 
          onSave={handleBulkImport}
          meters={data()?.meters || []}
      />
      
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 class="text-4xl font-black tracking-tighter">Financial Cockpit</h1>
          <p class="text-base-content/60 font-bold">Aggregated insights across all your energy sources.</p>
        </div>
        <div class="flex gap-2">
           <button class="btn btn-ghost btn-md rounded-2xl" onClick={() => setImportOpen(true)}>
             Import CSV
           </button>
           <A href="/add-reading" class="btn btn-primary btn-md rounded-2xl shadow-xl shadow-primary/20 px-8 text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 4v16m8-8H4" /></svg>
            Quick Add Reading
          </A>
        </div>
      </div>

      <Show when={!data.loading} fallback={<div class="flex justify-center py-20"><span class="loading loading-spinner loading-lg text-primary"></span></div>}>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Show when={data()?.hasMeters}>
            <div class="card bg-primary text-primary-content shadow-2xl p-8 rounded-3xl relative overflow-hidden group">
              <div class="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-700"></div>
              <div class="relative z-10">
                <p class="text-xs font-black uppercase tracking-[0.2em] opacity-70 mb-2">Total Projected Yearly Cost</p>
                <h2 class="text-6xl font-black tracking-tighter mb-6">€{Math.round(data()?.aggregates.totalYearlyCost || 0)}</h2>
                <div class="flex gap-10 pt-6 border-t border-white/10">
                  <Show when={data()?.hasPower}>
                    <div>
                      <p class="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Power</p>
                      <p class="text-xl font-black">€{Math.round(data()?.aggregates.powerYearlyCost || 0)}</p>
                    </div>
                  </Show>
                  <Show when={data()?.hasGas}>
                    <div>
                      <p class="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Gas</p>
                      <p class="text-xl font-black">€{Math.round(data()?.aggregates.gasYearlyCost || 0)}</p>
                    </div>
                  </Show>
                </div>
              </div>
            </div>
          </Show>

          <Show when={data()?.hasMissingContracts}>
            <div class="card bg-warning/10 text-warning border border-warning/20 shadow-xl p-8 rounded-3xl flex flex-col justify-center items-center text-center space-y-4">
               <div class="bg-warning/20 p-4 rounded-2xl">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
               </div>
               <h3 class="text-lg font-black tracking-tight uppercase">No contract on meter</h3>
               <p class="text-sm font-bold opacity-80 max-w-xs text-base-content/70">
                 One or more of your meters have no pricing contracts configured. Add one to see cost projections.
               </p>
               <A href="/contracts/add" class="btn btn-warning btn-wide rounded-2xl shadow-xl shadow-warning/20 font-black">Add Contract</A>
            </div>
          </Show>

          <Show when={data()?.hasPartialGaps}>
            <div class="card bg-warning/10 text-warning border border-warning/20 shadow-xl p-8 rounded-3xl flex flex-col justify-center items-center text-center space-y-4">
               <div class="bg-warning/20 p-4 rounded-2xl">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-12 0 9 9 0 0112 0z" /></svg>
               </div>
               <h3 class="text-lg font-black tracking-tight uppercase">Partial contracts missing</h3>
               <p class="text-sm font-bold opacity-80 max-w-xs text-base-content/70">
                 We detected gaps in your contract coverage. Fill them to ensure 100% accurate financial history.
               </p>
               <A href="/contracts" class="btn btn-warning btn-wide rounded-2xl shadow-xl shadow-warning/20 font-black">Show Contract Page</A>
            </div>
          </Show>

          <Show when={!data()?.hasMeters}>
            <div class="card bg-base-100 shadow-xl border border-base-content/5 p-8 rounded-3xl flex flex-col justify-center items-center text-center space-y-4">
               <div class="bg-base-200 p-4 rounded-2xl text-base-content/20">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0112 0z" /></svg>
               </div>
               <h3 class="text-lg font-black tracking-tight uppercase opacity-40">Getting Started</h3>
               <p class="text-sm font-bold text-base-content/60 max-w-xs">
                 To begin tracking your energy costs, you first need to register a utility meter.
               </p>
               <A href="/meters/add" class="btn btn-primary btn-wide rounded-2xl shadow-xl shadow-primary/20">Add Meter</A>
            </div>
          </Show>

          <Show when={data()?.hasMeters && !data()?.hasMissingContracts}>
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
        </div>
      </Show>
    </div>
  );
};

export default Dashboard;