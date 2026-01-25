import { Component, createResource, For, Show } from 'solid-js';
import { A } from '@solidjs/router';
import { calculateStats } from '../lib/consumption';
import { findContractForDate, calculateCostForContract } from '../lib/pricing';
import { useToast } from '../context/ToastContext';

const fetchDashboardData = async () => {
  const res = await fetch('/api/dashboard');
  if (!res.ok) {throw new Error('Failed to fetch dashboard data');}
  return res.json();
};

const Meters: Component = () => {
  const [data, { refetch }] = createResource(fetchDashboardData);
  const toast = useToast();

  const handleDeleteMeter = async (id: string) => {
    const confirmed = await toast.confirm('Are you sure you want to delete this meter? This will also remove all its readings and contracts.');
    if (!confirmed) {return;}
    try {
      const res = await fetch(`/api/meters/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.showToast('Meter deleted successfully', 'success');
        refetch();
      } else {
        toast.showToast('Failed to delete meter', 'error');
      }
    } catch (err) {
      console.error(err);
      toast.showToast('An error occurred while deleting the meter', 'error');
    }
  };

  return (
    <div class="p-4 md:p-10 lg:p-12 max-w-6xl mx-auto space-y-6 md:space-y-10 flex-1 min-w-0">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 class="text-4xl font-black tracking-tighter">Your Meters</h1>
          <p class="text-base-content/60 font-bold">Manage your utility meters and infrastructure.</p>
        </div>
        <A href="/meters/add" class="btn btn-primary btn-md rounded-2xl shadow-xl shadow-primary/20 px-8 text-sm">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 4v16m8-8H4" /></svg>
          Add Meter
        </A>
      </div>

      <Show when={!data.loading} fallback={<div class="flex justify-center py-20"><span class="loading loading-spinner loading-lg text-primary"></span></div>}>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <For each={data()?.meters} fallback={
            <div class="col-span-full card bg-base-100 border border-dashed border-base-content/20 py-20 text-center">
              <div class="card-body items-center">
                <div class="bg-base-200 p-6 rounded-full mb-4 text-base-content/20">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                </div>
                <h3 class="text-xl font-black opacity-40 uppercase tracking-widest">No meters found</h3>
                <p class="text-base-content/40 font-bold mb-6">Start by adding your first utility meter before logging readings.</p>
                <A href="/meters/add" class="btn btn-primary btn-wide rounded-2xl shadow-xl shadow-primary/20">Add Meter</A>
              </div>
            </div>
          }>
            {(meter) => {
              const meterReadings = () => data()?.readings?.filter((r: any) => r.meterId === meter._id) || [];
              const meterContracts = () => data()?.contracts?.filter((c: any) => c.meterId === meter._id) || [];
              
              const stats = () => {
                const readings = meterReadings();
                if (readings.length < 2) {return { dailyAverage: 0, yearlyProjection: 0, estimatedYearlyCost: 0 };}
                
                const consumptionStats = calculateStats(readings.map((r: any) => ({
                  value: r.value,
                  date: new Date(r.date)
                })));

                const activeContract = findContractForDate(meterContracts(), new Date());
                let estimatedYearlyCost = 0;
                if (activeContract) {
                  estimatedYearlyCost = calculateCostForContract({
                    consumption: consumptionStats.yearlyProjection,
                    days: 365.25,
                    contract: activeContract
                  });
                }

                return { ...consumptionStats, estimatedYearlyCost };
              };

              const hasContract = () => meterContracts().length > 0;
              
              return (
                <div class="card bg-base-100 shadow-xl border border-base-content/5 hover:border-primary/30 transition-all group overflow-hidden">
                  <div class="card-body p-8">
                    <div class="flex items-center gap-4 mb-6">
                      <div class={`p-3 rounded-2xl ${meter.type === 'power' ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'}`}>
                        {meter.type === 'power' ? (
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.99 7.99 0 0120 13a7.98 7.99 0 01-2.343 5.657z" /></svg>
                        )}
                      </div>
                      <div>
                        <h3 class="text-xl font-black tracking-tight">{meter.name}</h3>
                        <p class="text-xs font-mono opacity-40">{meter.meterNumber}</p>
                      </div>
                    </div>

                    <div class="grid grid-cols-2 gap-4 mb-6 pt-4 border-t border-base-content/5">
                      <div>
                        <p class="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">Daily Avg</p>
                        <p class="text-lg font-black">{stats().dailyAverage.toFixed(2)}<span class="text-[10px] font-bold opacity-40 ml-1">{meter.unit}</span></p>
                      </div>
                      <div>
                        <p class="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">Yearly Cost</p>
                        <Show when={stats().estimatedYearlyCost > 0} fallback={<p class="text-xs font-bold opacity-20 mt-1">N/A</p>}>
                          <p class="text-lg font-black text-primary">€{Math.round(stats().estimatedYearlyCost)}</p>
                        </Show>
                      </div>
                    </div>

                    <Show when={!hasContract()}>
                      <div class="bg-warning/5 border border-warning/20 p-4 rounded-xl mb-4">
                        <p class="text-[10px] font-black text-warning uppercase tracking-widest leading-none mb-1">No Contract</p>
                        <A href="/contracts/add" class="link link-warning text-xs font-bold">Configure pricing →</A>
                      </div>
                    </Show>
                    
                    <div class="card-actions justify-between items-center mt-auto pt-4 border-t border-base-content/5">
                      <div class="flex items-center gap-2 flex-1">
                        <A href={`/meters/${meter._id}/add-reading`} class="btn btn-primary btn-sm rounded-xl font-black px-6 text-xs h-10 flex-1">Add Reading</A>
                        <div class="flex gap-1">
                          <A href={`/meters/${meter._id}/readings`} class="btn btn-ghost btn-sm btn-square rounded-xl font-bold opacity-60 hover:opacity-100" title="Reading History">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-12 0 9 9 0 0112 0z" /></svg>
                          </A>
                          <A href={`/meters/${meter._id}`} class="btn btn-ghost btn-sm btn-square rounded-xl font-bold opacity-60 hover:opacity-100" title="Meter Details">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                          </A>
                        </div>
                      </div>
                    </div>

                    <div class="flex justify-end gap-1 mt-2">
                      <A href={`/meters/${meter._id}/edit`} class="btn btn-ghost btn-xs rounded-lg font-bold opacity-40 hover:opacity-100 hover:bg-base-200" title="Edit Meter">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        <span class="text-[10px] uppercase tracking-tighter">Edit</span>
                      </A>
                      <button onClick={() => handleDeleteMeter(meter._id)} class="btn btn-ghost btn-xs rounded-lg font-bold opacity-40 hover:opacity-100 hover:bg-error/10 hover:text-error" title="Delete Meter">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        <span class="text-[10px] uppercase tracking-tighter">Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            }}
          </For>
        </div>
      </Show>
    </div>
  );
};

export default Meters;
