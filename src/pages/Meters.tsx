import { Component, createResource, For, Show } from 'solid-js';
import { A, useNavigate } from '@solidjs/router';
import { calculateStats } from '../lib/consumption';
import { findContractForDate, calculateCostForContract, calculateIntervalCost } from '../lib/pricing';
import { findContractGaps } from '../lib/gapDetection';
import { useToast } from '../context/ToastContext';
import EmptyState from '../components/EmptyState';

const fetchDashboardData = async () => {
  const res = await fetch('/api/dashboard');
  if (!res.ok) {throw new Error('Failed to fetch dashboard data');}
  return res.json();
};

interface Meter {
  _id: string;
  name: string;
  unit: string;
  type: string;
  meterNumber: string;
}

interface Reading {
  meterId: string;
  date: string | Date;
  value: number;
}

interface Contract {
  _id: string;
  meterId: string;
  startDate: string | Date;
  endDate?: string | Date;
}

const Meters: Component = () => {
   const [data, { refetch }] = createResource(fetchDashboardData);
   const toast = useToast();
   const navigate = useNavigate();

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
          <div class="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <A href="/meters/add" class="btn btn-primary btn-md rounded-2xl shadow-xl shadow-primary/20 px-8 text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 4v16m8-8H4" /></svg>
              Add Meter
            </A>
          </div>
       </div>

      <Show when={!data.loading} fallback={<div class="flex justify-center py-20"><span class="loading loading-spinner loading-lg text-primary"></span></div>}>
        <div data-testid="meters-grid" class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <For each={data()?.meters} fallback={
            <EmptyState 
              title="No meters found"
              description="Start by adding your first utility meter before logging readings."
              actionLabel="Add Meter"
              actionLink="/meters/add"
              icon={<svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
            />
          }>
            {(meter: Meter) => {
              const meterReadings = () => data()?.readings?.filter((r: Reading) => r.meterId === meter._id) || [];
              const meterContracts = () => data()?.contracts?.filter((c: Contract) => c.meterId === meter._id) || [];
              
              const stats = () => {
                const readings = meterReadings();
                if (readings.length < 2) {return { dailyAverage: 0, yearlyProjection: 0, estimatedYearlyCost: 0, dailyCost: 0 };}
                
                const consumptionStats = calculateStats(readings.map((r: Reading) => ({
                  value: r.value,
                  date: new Date(r.date)
                })));

                // Calculate cost for the most recent interval
                const sortedReadings = [...readings].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                const last = sortedReadings[0];
                const prev = sortedReadings[1];
                const intervalDays = (new Date(last.date).getTime() - new Date(prev.date).getTime()) / (1000 * 60 * 60 * 24);
                
                let dailyCost = 0;
                if (intervalDays > 0) {
                  const totalIntervalCost = calculateIntervalCost(
                    new Date(prev.date),
                    new Date(last.date),
                    last.value - prev.value,
                    meterContracts()
                  );
                  dailyCost = totalIntervalCost / intervalDays;
                }

                const activeContract = findContractForDate(meterContracts(), new Date());
                let estimatedYearlyCost = 0;
                if (activeContract) {
                  estimatedYearlyCost = calculateCostForContract({
                    consumption: consumptionStats.yearlyProjection,
                    days: 365.25,
                    contract: activeContract
                  });
                }

                return { ...consumptionStats, estimatedYearlyCost, dailyCost };
              };

              const gaps = () => {
                const readings = meterReadings();
                const contracts = meterContracts();
                return findContractGaps(readings, contracts);
              };

              const hasContract = () => meterContracts().length > 0;
              const hasGaps = () => gaps().length > 0;
              
              return (
                <div 
                  class="card bg-base-100 shadow-xl border border-base-content/5 hover:border-primary/30 transition-all group overflow-visible relative hover:shadow-2xl cursor-pointer"
                  onClick={() => navigate(`/meters/${meter._id}`)}
                >
                  <div class="card-body p-8">
                    
                    <Show when={hasGaps()}>
                      <div class="absolute top-4 right-4 z-20">
                        <div class="tooltip tooltip-left before:text-xs before:max-w-[150px] before:whitespace-normal" data-tip="Coverage gaps detected in reading history">
                          <div class="bg-warning/20 text-warning p-2 rounded-xl border border-warning/20">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                          </div>
                        </div>
                      </div>
                    </Show>

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
                        <p class="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">Consumption</p>
                        <p class="text-lg font-black">{stats().dailyAverage.toFixed(2)}<span class="text-[10px] font-bold opacity-40 ml-1">{meter.unit}/day</span></p>
                        <Show when={stats().dailyCost > 0}>
                          <p class="text-[10px] font-bold text-success mt-0.5">€{stats().dailyCost.toFixed(2)}/day</p>
                        </Show>
                      </div>
                      <div>
                        <p class="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">Yearly Cost</p>
                        <Show when={stats().estimatedYearlyCost > 0} fallback={<p class="text-xs font-bold opacity-20 mt-1">N/A</p>}>
                          <p class="text-lg font-black text-primary">€{Math.round(stats().estimatedYearlyCost)}</p>
                        </Show>
                      </div>
                    </div>

                    <Show when={!hasContract()}>
                      <div class="bg-warning/5 border border-dashed border-warning/20 p-5 rounded-2xl mb-6 flex flex-col items-center text-center gap-2 group hover:border-warning/40 transition-all">
                        <div class="bg-warning/10 p-2 rounded-xl text-warning">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        </div>
                        <div>
                          <p class="text-[10px] font-black text-warning uppercase tracking-widest leading-none mb-1">No Contract</p>
                          <p class="text-[10px] font-bold text-base-content/60 mb-2">Configure pricing to see costs</p>
                          <A href={`/contracts/add?meterId=${meter._id}`} class="btn btn-warning btn-xs rounded-lg font-black px-4 shadow-lg shadow-warning/20">Add Contract</A>
                        </div>
                      </div>
                    </Show>
                    
                    <div class="card-actions justify-center items-center mt-auto pt-4 border-t border-base-content/5">
                      <A href={`/meters/${meter._id}/add-reading`} class="btn btn-primary btn-sm rounded-xl font-black px-6 text-xs h-10 flex-1" onClick={(e) => e.stopPropagation()}>Add Reading</A>
                    </div>

                    <div class="flex justify-end gap-1 mt-2">
                      <A href={`/meters/${meter._id}/edit`} class="btn btn-ghost btn-xs rounded-lg font-bold opacity-40 hover:opacity-100 hover:bg-base-200" title="Edit Meter" onClick={(e) => e.stopPropagation()}>
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        <span class="text-[10px] uppercase tracking-tighter">Edit</span>
                      </A>
                      <button onClick={(e) => {e.stopPropagation(); handleDeleteMeter(meter._id);}} class="btn btn-ghost btn-xs rounded-lg font-bold opacity-40 hover:opacity-100 hover:bg-error/10 hover:text-error" title="Delete Meter">
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
