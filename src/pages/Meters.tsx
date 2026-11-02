import { Component, createResource, For, Show } from 'solid-js';
import { A } from '@solidjs/router';
import { findContractGaps } from '../lib/gapDetection';
import { useToast } from '../context/ToastContext';
import EmptyState from '../components/EmptyState';
import Icon from '../components/Icon';
import PageHeader from '../components/PageHeader';
import { IMeter as Meter, IReading as Reading, IContract as Contract } from '../types/models';
import { formatCurrency, formatFixed } from '../lib/format';

const fetchDashboardData = async () => {
  const res = await fetch('/api/dashboard');
  if (!res.ok) {throw new Error('Failed to fetch dashboard data');}
  return res.json();
};

interface MeterCardProps {
  meter: Meter;
  readings: Reading[];
  contracts: Contract[];
  onDelete: (id: string) => void;
}

const MeterCard: Component<MeterCardProps> = (props) => {
  const stats = () => {
    // Use pre-calculated stats from backend.
    return props.meter.stats || { dailyAverage: 0, yearlyProjection: 0, estimatedYearlyCost: 0, dailyCost: 0 };
  };

  const gaps = () => findContractGaps(props.readings, props.contracts);

  const hasContract = () => props.contracts.length > 0;
  const hasGaps = () => gaps().length > 0;
  
  const formatDateForURL = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const meterColor = () => props.meter.type === 'power' ? 'var(--color-meter-power)' : 'var(--color-meter-gas)';
  
  return (
    <div class="card bg-base-100 border border-base-content/5 shadow-sm hover:border-primary/30 transition-all group overflow-hidden hover:shadow-md">
      <div class="card-body p-6 md:p-7">
        
        <div class="flex justify-between items-start mb-5">
          <div class="p-2.5 rounded-xl bg-primary/10 text-primary">
             <Icon name="meter" class="h-5 w-5" />
          </div>
          <div class="text-right">
            <p class="text-[10px] font-bold uppercase tracking-wider opacity-40">Meter number</p>
            <p class="font-mono text-sm font-bold">{props.meter.meterNumber}</p>
          </div>
        </div>

        <h3 class="text-2xl font-black tracking-tight mb-1">
          <A
            href={`/meters/${props.meter._id}`}
            class="rounded-sm transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
          >
            {props.meter.name}
          </A>
        </h3>
        <div class="mb-6 flex gap-2 items-center">
            <div 
              class="p-1.5 rounded-lg"
              style={{ "background-color": `color-mix(in srgb, ${meterColor()}, transparent 90%)`, "color": meterColor() }}
            >
              <Icon name={props.meter.type as 'power' | 'gas'} class="h-4 w-4" />
            </div>
            <A 
                href={`/contracts?meterId=${props.meter._id}`}
                class="badge badge-sm badge-ghost font-black uppercase tracking-tighter hover:bg-primary/10 hover:text-primary transition-colors"
                onClick={(e) => e.stopPropagation()}
            >
                View Contracts
            </A>
        </div>

        <div class="grid grid-cols-2 gap-4 pt-6 border-t border-base-content/5">
          <div>
            <p class="text-[10px] font-bold uppercase tracking-wider opacity-40 mb-1">Consumption</p>
            <p class="text-xl font-black">{formatFixed(stats().dailyAverage, 2)}<span class="text-xs font-bold opacity-40 ml-1">{props.meter.unit}/day</span></p>
            <Show when={stats().dailyCost > 0}>
              <p class="text-[10px] font-bold text-success mt-0.5">{formatCurrency(stats().dailyCost)}/day</p>
            </Show>
          </div>
          <div>
            <p class="text-[10px] font-bold uppercase tracking-wider opacity-40 mb-1">Yearly Cost</p>
            <Show when={hasContract() && !hasGaps()} fallback={<p class="text-xs font-bold opacity-20 mt-1">N/A</p>}>
              <p class="text-xl font-black text-primary">{formatCurrency(stats().estimatedYearlyCost, 0)}</p>
            </Show>
          </div>
        </div>

        <Show when={!hasContract() || hasGaps()}>
          <div 
            class={`border-2 border-dashed p-4 rounded-2xl mt-6 flex flex-col items-center text-center gap-2 group transition-all cursor-default ${hasGaps() ? 'bg-base-200/30 border-base-content/10 hover:border-primary/30' : 'bg-warning/5 border-warning/20 hover:border-warning/40'}`}
            onClick={(e) => e.stopPropagation()}
          >
             <p class={`text-[10px] font-bold uppercase tracking-wider leading-none ${hasGaps() ? 'text-primary' : 'text-warning'}`}>
                {hasGaps() ? `${gaps().length} Coverage Gap${gaps().length > 1 ? 's' : ''}` : 'Pricing Missing'}
              </p>
              <A 
                href={`/contracts/add?meterId=${props.meter._id}${hasGaps() ? `&startDate=${formatDateForURL(gaps()[0].startDate)}&endDate=${formatDateForURL(gaps()[0].endDate)}` : ''}`} 
                class={`btn btn-xs rounded-xl font-black px-4 shadow-lg ${hasGaps() ? 'btn-primary shadow-primary/20' : 'btn-warning shadow-warning/20'}`}
              >
                {hasGaps() ? 'Fill First Gap' : 'Add Contract'}
              </A>
          </div>
        </Show>
        
        <div class="flex justify-between items-center mt-6 pt-4 border-t border-base-content/5">
            <A href={`/meters/${props.meter._id}/add-reading`} class="btn btn-primary btn-sm rounded-xl font-black px-4 text-[10px] h-8" onClick={(e) => e.stopPropagation()}>Add reading</A>
            <div class="flex gap-1">
                <A href={`/meters/${props.meter._id}/edit`} class="btn btn-ghost btn-xs rounded-xl font-bold opacity-40 hover:opacity-100 hover:bg-base-200" title="Edit Meter" onClick={(e) => e.stopPropagation()}>
                    <Icon name="edit" class="h-4 w-4" />
                    <span class="text-[10px] uppercase tracking-tighter">Edit</span>
                </A>
                <button onClick={(e) => {e.stopPropagation(); props.onDelete(props.meter._id);}} class="btn btn-ghost btn-xs rounded-xl font-bold opacity-40 hover:opacity-100 hover:bg-error/10 hover:text-error" title="Delete Meter">
                    <Icon name="delete" class="h-4 w-4" />
                    <span class="text-[10px] uppercase tracking-tighter">Delete</span>
                </button>
            </div>
        </div>
       </div>
     </div>
  );
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
     <div class="p-4 md:p-10 max-w-6xl mx-auto space-y-6 flex-1 min-w-0 w-full">
       <PageHeader
         eyebrow="Meters"
         title="Your meters"
         subtitle="Manage your utility meters and infrastructure."
         actions={
           <A href="/meters/add" class="btn btn-primary btn-sm rounded-xl font-bold">
             <Icon name="add" class="h-4 w-4" /> Add meter
           </A>
         }
       />

      <Show when={!data.loading} fallback={<div class="flex justify-center py-20"><span class="loading loading-spinner loading-lg text-primary"></span></div>}>
        <div data-testid="meters-grid" class={`grid grid-cols-1 gap-6 ${(data()?.meters?.length ?? 0) > 1 ? 'md:grid-cols-2' : ''}`}>
          <For each={data()?.meters} fallback={
            <EmptyState 
              title="No meters found"
              description="Start by adding your first utility meter before logging readings."
              actionLabel="Add Meter"
              actionLink="/meters/add"
              icon={<Icon name="meter" class="h-12 w-12" />}
            />
           }>
               {(meter: Meter) => {
               const meterReadings = () => data()?.readings?.filter((r: Reading) => {
                 const rId = typeof r.meterId === 'string' ? r.meterId : (r.meterId as unknown as { _id: string })?._id;
                 return rId === meter._id;
               }) || [];
               const meterContracts = () => data()?.contracts?.filter((c: Contract) => {
                 const cId = typeof c.meterId === 'string' ? c.meterId : (c.meterId as unknown as { _id: string })?._id;
                 return cId === meter._id;
               }) || [];

              return (
                <MeterCard 
                  meter={meter} 
                  readings={meterReadings()} 
                  contracts={meterContracts()} 
                  onDelete={handleDeleteMeter}
                />
               );
             }}
          </For>
        </div>
      </Show>
    </div>
  );
};

export default Meters;
