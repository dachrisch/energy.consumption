import { Component, createResource, For, Show } from 'solid-js';
import { A, useNavigate, useSearchParams } from '@solidjs/router';
import { useToast } from '../context/ToastContext';
import { findContractGaps, Gap } from '../lib/gapDetection';
import ContractTemplateCard from '../components/ContractTemplateCard';
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
}

interface Contract {
  _id: string;
  providerName: string;
  type: 'power' | 'gas';
  startDate: string | Date;
  endDate?: string | Date;
  basePrice: number;
  workingPrice: number;
  meterId: Meter;
}

const ContractHeader: Component<{
  meterId?: string;
  meters: Meter[];
  onMeterChange: (id: string) => void;
}> = (props) => (
  <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
    <div>
      <h1 class="text-4xl font-black tracking-tighter">Utility Contracts</h1>
      <p class="text-base-content/60 font-bold text-lg">Manage your energy provider pricing.</p>
    </div>
    <div class="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
      <Show when={props.meters.length > 0}>
        <select 
          class="select select-bordered rounded-2xl bg-base-200 border-none font-bold text-sm h-12"
          value={props.meterId || ''}
          onChange={(e) => props.onMeterChange(e.currentTarget.value)}
        >
          <option value="">All Meters</option>
          <For each={props.meters}>
            {(m: Meter) => <option value={m._id}>{m.name}</option>}
          </For>
        </select>
      </Show>
      <A href="/contracts/add" class="btn btn-primary btn-md rounded-2xl shadow-xl shadow-primary/20 px-8 text-sm h-12">
        <Icon name="add" class="h-5 w-5" />
        Add Contract
      </A>
    </div>
  </div>
);

const ContractCard: Component<{
  contract: Contract;
  onDelete: (id: string) => void;
}> = (props) => {
  const contractColor = () => props.contract.type === 'power' ? 'var(--color-meter-power)' : 'var(--color-meter-gas)';
  
  return (
    <div 
      class="card bg-base-100 shadow-xl border border-base-content/5 overflow-hidden hover:border-primary/30 transition-all hover:shadow-2xl"
    >
      <div class="card-body p-8">
        <div class="flex justify-between items-start mb-6">
          <div class="p-3 rounded-2xl bg-primary/10 text-primary">
             <Icon name="contract" class="h-6 w-6" />
          </div>
          <div class="text-right">
            <p class="text-xs font-black uppercase tracking-widest opacity-40">Validity Period</p>
            <p class="font-bold text-sm">
              {new Date(props.contract.startDate).toLocaleDateString()} - 
              {props.contract.endDate ? new Date(props.contract.endDate).toLocaleDateString() : 'Present'}
            </p>
          </div>
        </div>

        <h3 class="text-2xl font-black tracking-tight mb-1">{props.contract.providerName}</h3>
        <div class="mb-6 flex flex-col gap-2">
          <div>
            <p class="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">Linked to Meter</p>
            <div class="flex items-center gap-2">
                <A 
                  href={`/meters/${props.contract.meterId?._id}`} 
                  class="btn btn-ghost btn-xs rounded-lg font-bold bg-base-200/50 hover:bg-primary/10 hover:text-primary px-3 h-8 lowercase"
                >
                  {props.contract.meterId?.name || 'Unknown Meter'}
                </A>
                <div 
                  class="p-1.5 rounded-lg"
                  style={{ "background-color": `color-mix(in srgb, ${contractColor()}, transparent 90%)`, "color": contractColor() }}
                >
                  <Icon name={props.contract.type} class="h-4 w-4" />
                </div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4 pt-6 border-t border-base-content/5">
          <div>
            <p class="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">Base Price</p>
            <p class="text-xl font-black">€{props.contract.basePrice.toFixed(2)}<span class="text-xs font-bold opacity-40 ml-1">/mo</span></p>
          </div>
          <div>
            <p class="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">Working Price</p>
            <p class="text-xl font-black">€{props.contract.workingPrice.toFixed(4)}<span class="text-xs font-bold opacity-40 ml-1">/{props.contract.type === 'power' ? 'kWh' : 'm³'}</span></p>
          </div>
        </div>

        <div class="flex justify-end gap-1 mt-6 pt-4 border-t border-base-content/5">
          <A 
            href={`/contracts/${props.contract._id}/edit`} 
            class="btn btn-ghost btn-xs rounded-lg font-bold opacity-40 hover:opacity-100 hover:bg-base-200" 
            title="Edit Contract"
          >
            <Icon name="edit" class="h-4 w-4" />
            <span class="text-[10px] uppercase tracking-tighter">Edit</span>
          </A>
          <button 
            onClick={() => props.onDelete(props.contract._id)} 
            class="btn btn-ghost btn-xs rounded-lg font-bold opacity-40 hover:opacity-100 hover:bg-error/10 hover:text-error" 
            title="Delete Contract"
          >
            <Icon name="delete" class="h-4 w-4" />
            <span class="text-[10px] uppercase tracking-tighter">Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
};

interface DashboardData {
  meters: Meter[];
  readings: { meterId: string }[];
  contracts: Contract[];
}

const calculateGaps = (data: DashboardData | undefined, searchMeterId?: string) => {
  if (!data || !data.meters.length) {return [];}
  
  const filteredMeters = searchMeterId 
    ? data.meters.filter((m: Meter) => m._id === searchMeterId)
    : data.meters;

   return filteredMeters.flatMap((meter: Meter) => {
     const meterReadings = data.readings.filter((r: { meterId: string }) => r.meterId === meter._id);
     const meterContracts = data.contracts.filter((c: Contract) => {
       const cMeterId = typeof c.meterId === 'string' ? c.meterId : (c.meterId as unknown as { _id: string })?._id;
       return cMeterId === meter._id;
     });
     return findContractGaps(meterReadings, meterContracts).map(gap => ({ gap, meter }));
   });
};

const getSortedItems = (data: DashboardData | undefined, gaps: Array<{ gap: Gap; meter: Meter }>, searchMeterId?: string) => {
  if (!data) {return [];}

  const contractItems = (data.contracts || [])
    .filter((c: Contract) => {
      if (!searchMeterId) {return true;}
      const cMeterId = typeof c.meterId === 'string' ? c.meterId : (c.meterId as unknown as { _id: string })?._id;
      return cMeterId === searchMeterId;
    })
    .map((c: Contract) => ({
      type: 'contract',
      data: c,
      date: new Date(c.startDate).getTime(),
      utilityType: c.type
    }));

  const gapItems = gaps.map((g: { gap: Gap, meter: { _id: string, name: string, type: string } }) => ({
    type: 'gap',
    data: g,
    date: g.gap.startDate.getTime(),
    utilityType: g.meter.type
  }));

  return [...contractItems, ...gapItems].sort((a, b) => {
    if (a.utilityType !== b.utilityType) {
      return a.utilityType.localeCompare(b.utilityType);
    }
    return b.date - a.date;
  });
};

const Contracts: Component = () => {
  const [data, { refetch }] = createResource(fetchDashboardData);
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const gaps = () => calculateGaps(data(), searchParams.meterId);
  const sortedItems = () => getSortedItems(data(), gaps(), searchParams.meterId);

  const handleDeleteContract = async (id: string) => {
    const confirmed = await toast.confirm('Are you sure you want to delete this contract?');
    if (!confirmed) {return;}
    try {
      const res = await fetch(`/api/contracts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.showToast('Contract deleted successfully', 'success');
        refetch();
      } else {
        toast.showToast('Failed to delete contract', 'error');
      }
    } catch (err) {
      console.error(err);
      toast.showToast('An error occurred while deleting the contract', 'error');
    }
  };

    return (
      <div class="p-6 md:p-10 lg:p-12 max-w-6xl mx-auto space-y-10">
        <ContractHeader 
          meterId={searchParams.meterId} 
          meters={data()?.meters || []} 
          onMeterChange={(val) => navigate(val ? `/contracts?meterId=${val}` : '/contracts')}
        />
  
         <Show when={!data.loading} fallback={<div class="flex justify-center py-20"><span class="loading loading-spinner loading-lg text-primary"></span></div>}>
           <Show when={data()?.meters?.length} fallback={
             <EmptyState 
               title="No meters exist"
               description="Create a meter first to add contracts and track utility consumption."
               actionLabel="Add Meter"
               actionLink="/add-meter"
               colorScheme="neutral"
               icon={<Icon name="contract" class="h-12 w-12" />}
             />
           }>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <For each={sortedItems()} fallback={
                  <EmptyState 
                    title="No contracts defined"
                    description="Enter your contract details to enable precise cost projections and historical analysis."
                    actionLabel="Register First Contract"
                    actionLink="/contracts/add"
                    icon={<Icon name="contract" class="h-12 w-12" />}
                  />
                }>
                  {(item: { type: string, data: Contract | { gap: Gap, meter: { _id: string, name: string, type: string } } }) => (
                    <Show when={item.type === 'contract'} fallback={
                      <ContractTemplateCard gap={(item.data as { gap: Gap, meter: { _id: string, name: string, type: string } }).gap} meter={(item.data as { gap: Gap, meter: { _id: string, name: string, type: string } }).meter} />
                 }>
                    <ContractCard 
                      contract={item.data as Contract} 
                      onDelete={handleDeleteContract} 
                    />
                </Show>
              )}
               </For>
             </div>
           </Show>
         </Show>
      </div>
    );
  };
  export default Contracts;