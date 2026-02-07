import { Component, createResource, For, Show } from 'solid-js';
import { A, useNavigate } from '@solidjs/router';
import { calculateStats } from '../lib/consumption';
import { findContractForDate, calculateCostForContract, calculateIntervalCost } from '../lib/pricing';
import { findContractGaps } from '../lib/gapDetection';
import { useToast } from '../context/ToastContext';
import EmptyState from '../components/EmptyState';
import Icon from '../components/Icon';

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
   basePrice: number;
   workingPrice: number;
   type: 'power' | 'gas';
   providerName: string;
}

const calculateMeterStats = (readings: Reading[], contracts: Contract[]) => {
  if (readings.length < 2) {
    return { dailyAverage: 0, yearlyProjection: 0, estimatedYearlyCost: 0, dailyCost: 0 };
  }

  const consumptionStats = calculateStats(readings.map((r: Reading) => ({
    value: r.value,
    date: new Date(r.date)
  })));

  const sortedReadings = [...readings].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const last = sortedReadings[0];
  const prev = sortedReadings[1];
  const intervalDays = (new Date(last.date).getTime() - new Date(prev.date).getTime()) / (1000 * 60 * 60 * 24);

  let dailyCost = 0;
  if (intervalDays > 0) {
    const normalizedContracts = contracts.map((c) => ({
      ...c,
      startDate: new Date(c.startDate),
      endDate: c.endDate ? new Date(c.endDate) : null
    }));
    const totalIntervalCost = calculateIntervalCost(
      new Date(prev.date),
      new Date(last.date),
      last.value - prev.value,
      normalizedContracts
    );
    dailyCost = totalIntervalCost / intervalDays;
  }

  const normalizedContracts = contracts.map((c) => ({
    ...c,
    startDate: new Date(c.startDate),
    endDate: c.endDate ? new Date(c.endDate) : null
  }));
  const activeContract = findContractForDate(normalizedContracts, new Date());
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
              <Icon name="add" class="h-5 w-5" />
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
              icon={<Icon name="meter" class="h-12 w-12" />}
            />
           }>
              {/* eslint-disable-next-line complexity */}
               {(meter: Meter) => {
               const meterReadings = () => data()?.readings?.filter((r: Reading) => {
                 const rId = typeof r.meterId === 'string' ? r.meterId : (r.meterId as unknown as { _id: string })?._id;
                 return rId === meter._id;
               }) || [];
               const meterContracts = () => data()?.contracts?.filter((c: Contract) => {
                 const cId = typeof c.meterId === 'string' ? c.meterId : (c.meterId as unknown as { _id: string })?._id;
                 return cId === meter._id;
               }) || [];

               const stats = () => calculateMeterStats(meterReadings(), meterContracts());

              const gaps = () => {
                const readings = meterReadings();
                const contracts = meterContracts();
                return findContractGaps(readings, contracts);
              };

              const hasContract = () => meterContracts().length > 0;
              const hasGaps = () => gaps().length > 0;
              
              const formatDateForURL = (d: Date) => {
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
              };
              
              const meterColor = () => meter.type === 'power' ? 'var(--color-meter-power)' : 'var(--color-meter-gas)';
              
              return (
                <div 
                  class="card bg-base-100 shadow-xl border border-base-content/5 hover:border-primary/30 transition-all group overflow-hidden hover:shadow-2xl cursor-pointer"
                  onClick={() => navigate(`/meters/${meter._id}`)}
                >
                  <div class="card-body p-8">
                    
                    <div class="flex justify-between items-start mb-6">
                      <div class="p-3 rounded-2xl bg-primary/10 text-primary">
                         <Icon name="meter" class="h-6 w-6" />
                      </div>
                      <div class="text-right">
                        <p class="text-xs font-black uppercase tracking-widest opacity-40">Meter Number</p>
                        <p class="font-mono text-sm font-bold">{meter.meterNumber}</p>
                      </div>
                    </div>

                    <h3 class="text-2xl font-black tracking-tight mb-1">{meter.name}</h3>
                    <div class="mb-6 flex gap-2 items-center">
                        <div 
                          class="p-1.5 rounded-lg"
                          style={{ "background-color": `color-mix(in srgb, ${meterColor()}, transparent 90%)`, "color": meterColor() }}
                        >
                          <Icon name={meter.type as 'power' | 'gas'} class="h-4 w-4" />
                        </div>
                        <A 
                            href={`/contracts?meterId=${meter._id}`}
                            class="badge badge-sm badge-ghost font-black uppercase tracking-tighter hover:bg-primary/10 hover:text-primary transition-colors"
                            onClick={(e) => e.stopPropagation()}
                        >
                            View Contracts
                        </A>
                        <Show when={hasGaps()}>
                            <span class="badge badge-sm badge-warning font-black uppercase tracking-tighter animate-pulse">Coverage Gaps</span>
                        </Show>
                    </div>

                    <div class="grid grid-cols-2 gap-4 pt-6 border-t border-base-content/5">
                      <div>
                        <p class="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">Consumption</p>
                        <p class="text-xl font-black">{stats().dailyAverage.toFixed(2)}<span class="text-xs font-bold opacity-40 ml-1">{meter.unit}/day</span></p>
                        <Show when={stats().dailyCost > 0}>
                          <p class="text-[10px] font-bold text-success mt-0.5">€{stats().dailyCost.toFixed(2)}/day</p>
                        </Show>
                      </div>
                      <div>
                        <p class="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">Yearly Cost</p>
                        <Show when={stats().estimatedYearlyCost > 0} fallback={<p class="text-xs font-bold opacity-20 mt-1">N/A</p>}>
                          <p class="text-xl font-black text-primary">€{Math.round(stats().estimatedYearlyCost)}</p>
                        </Show>
                      </div>
                    </div>

                    <Show when={!hasContract() || hasGaps()}>
                      <div 
                        class={`border-2 border-dashed p-4 rounded-2xl mt-6 flex flex-col items-center text-center gap-2 group transition-all cursor-default ${!hasContract() ? 'bg-warning/5 border-warning/20 hover:border-warning/40' : 'bg-base-200/30 border-base-content/10 hover:border-primary/30'}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                         <p class={`text-[10px] font-black uppercase tracking-widest leading-none ${!hasContract() ? 'text-warning' : 'text-primary'}`}>
                            {!hasContract() ? 'Pricing Missing' : `${gaps().length} Coverage Gap${gaps().length > 1 ? 's' : ''}`}
                          </p>
                          <A 
                            href={`/contracts/add?meterId=${meter._id}${hasGaps() ? `&startDate=${formatDateForURL(gaps()[0].startDate)}&endDate=${formatDateForURL(gaps()[0].endDate)}` : ''}`} 
                            class={`btn btn-xs rounded-lg font-black px-4 shadow-lg ${!hasContract() ? 'btn-warning shadow-warning/20' : 'btn-primary shadow-primary/20'}`}
                          >
                            {!hasContract() ? 'Add Contract' : 'Fill First Gap'}
                          </A>
                      </div>
                    </Show>
                    
                    <div class="flex justify-between items-center mt-6 pt-4 border-t border-base-content/5">
                        <A href={`/meters/${meter._id}/add-reading`} class="btn btn-primary btn-sm rounded-xl font-black px-4 text-[10px] h-8" onClick={(e) => e.stopPropagation()}>Log Reading</A>
                        <div class="flex gap-1">
                            <A href={`/meters/${meter._id}/edit`} class="btn btn-ghost btn-xs rounded-lg font-bold opacity-40 hover:opacity-100 hover:bg-base-200" title="Edit Meter" onClick={(e) => e.stopPropagation()}>
                                <Icon name="edit" class="h-4 w-4" />
                                <span class="text-[10px] uppercase tracking-tighter">Edit</span>
                            </A>
                            <button onClick={(e) => {e.stopPropagation(); handleDeleteMeter(meter._id);}} class="btn btn-ghost btn-xs rounded-lg font-bold opacity-40 hover:opacity-100 hover:bg-error/10 hover:text-error" title="Delete Meter">
                                <Icon name="delete" class="h-4 w-4" />
                                <span class="text-[10px] uppercase tracking-tighter">Delete</span>
                            </button>
                        </div>
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
