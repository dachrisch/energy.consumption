import { Component, createResource, For, Show } from 'solid-js';
import { A, useNavigate, useSearchParams } from '@solidjs/router';
import { useToast } from '../context/ToastContext';
import { findContractGaps, Gap } from '../lib/gapDetection';
import ContractTemplateCard from '../components/ContractTemplateCard';
import EmptyState from '../components/EmptyState';

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

const Contracts: Component = () => {
  const [data, { refetch }] = createResource(fetchDashboardData);
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

   const gaps = () => {
     const d = data();
     if (!d || !d.meters.length) {return [];}
     
     const filterMeterId = searchParams.meterId;
     const filteredMeters = filterMeterId 
       ? d.meters.filter((m: Meter) => m._id === filterMeterId)
       : d.meters;

      return filteredMeters.flatMap((meter: Meter) => {
        const meterReadings = d.readings.filter((r: { meterId: string }) => r.meterId === meter._id);
        const meterContracts = d.contracts.filter((c: Contract) => {
          const cMeterId = typeof c.meterId === 'string' ? c.meterId : (c.meterId as unknown as { _id: string })?._id;
          return cMeterId === meter._id;
        });
        return findContractGaps(meterReadings, meterContracts).map(gap => ({ gap, meter }));
      });
   };

  const sortedItems = () => {
    const d = data();
    if (!d) {return [];}

    const filterMeterId = searchParams.meterId;

    const contractItems = (d.contracts || [])
      .filter((c: Contract) => {
        if (!filterMeterId) return true;
        const cMeterId = typeof c.meterId === 'string' ? c.meterId : (c.meterId as unknown as { _id: string })?._id;
        return cMeterId === filterMeterId;
      })
      .map((c: Contract) => ({
        type: 'contract',
        data: c,
        date: new Date(c.startDate).getTime(),
        utilityType: c.type
      }));

    const gapItems = gaps().map((g: { gap: Gap, meter: { _id: string, name: string, type: string } }) => ({
      type: 'gap',
      data: g,
      date: g.gap.startDate.getTime(),
      utilityType: g.meter.type
    }));

    return [...contractItems, ...gapItems].sort((a, b) => {
      // First group by type (alphabetical: gas, power)
      if (a.utilityType !== b.utilityType) {
        return a.utilityType.localeCompare(b.utilityType);
      }
      // Then sort by date (newest first)
      return b.date - a.date;
    });
  };

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
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 class="text-4xl font-black tracking-tighter">Utility Contracts</h1>
          <p class="text-base-content/60 font-bold text-lg">Manage your energy provider pricing.</p>
        </div>
        <div class="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <Show when={data()?.meters?.length > 0}>
            <select 
              class="select select-bordered rounded-2xl bg-base-200 border-none font-bold text-sm h-12"
              value={searchParams.meterId || ''}
              onChange={(e) => {
                const val = e.currentTarget.value;
                navigate(val ? `/contracts?meterId=${val}` : '/contracts');
              }}
            >
              <option value="">All Meters</option>
              <For each={data()?.meters}>
                {(m: Meter) => <option value={m._id}>{m.name}</option>}
              </For>
            </select>
          </Show>
          <A href="/contracts/add" class="btn btn-primary btn-md rounded-2xl shadow-xl shadow-primary/20 px-8 text-sm h-12">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 4v16m8-8H4" /></svg>
            Add Contract
          </A>
        </div>
      </div>

       <Show when={!data.loading} fallback={<div class="flex justify-center py-20"><span class="loading loading-spinner loading-lg text-primary"></span></div>}>
         <Show when={data()?.meters?.length} fallback={
           <EmptyState 
             title="No meters exist"
             description="Create a meter first to add contracts and track utility consumption."
             actionLabel="Add Meter"
             actionLink="/add-meter"
             colorScheme="neutral"
             icon={<svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
           />
         }>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <For each={sortedItems()} fallback={
                <EmptyState 
                  title="No contracts defined"
                  description="Enter your contract details to enable precise cost projections and historical analysis."
                  actionLabel="Register First Contract"
                  actionLink="/contracts/add"
                  icon={<svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                />
              }>
                {(item: { type: string, data: Contract | { gap: Gap, meter: { _id: string, name: string, type: string } } }) => (
                  <Show when={item.type === 'contract'} fallback={
                    <ContractTemplateCard gap={(item.data as { gap: Gap, meter: { _id: string, name: string, type: string } }).gap} meter={(item.data as { gap: Gap, meter: { _id: string, name: string, type: string } }).meter} />
               }>
                {(() => {
                  const contract = item.data as Contract;
                  return (
                    <div 
                      class="card bg-base-100 shadow-xl border border-base-content/5 overflow-hidden hover:border-primary/30 transition-all hover:shadow-2xl cursor-pointer"
                      onClick={() => navigate(`/contracts/${contract._id}/edit`)}
                    >
                      <div class="card-body p-8">
                        <div class="flex justify-between items-start mb-6">
                          <div class="p-3 rounded-2xl bg-primary/10 text-primary">
                             <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                          </div>
                          <div class="text-right">
                            <p class="text-xs font-black uppercase tracking-widest opacity-40">Validity Period</p>
                            <p class="font-bold text-sm">
                              {new Date(contract.startDate).toLocaleDateString()} - 
                              {contract.endDate ? new Date(contract.endDate).toLocaleDateString() : 'Present'}
                            </p>
                          </div>
                        </div>

                        <h3 class="text-2xl font-black tracking-tight mb-1">{contract.providerName}</h3>
                        <div class="mb-6 flex flex-col gap-2">
                          <div>
                            <p class="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">Linked to Meter</p>
                            <div class="flex items-center gap-2">
                                <A 
                                  href={`/meters/${contract.meterId?._id}`} 
                                  class="btn btn-ghost btn-xs rounded-lg font-bold bg-base-200/50 hover:bg-primary/10 hover:text-primary px-3 h-8 lowercase"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {contract.meterId?.name || 'Unknown Meter'}
                                </A>
                                <div class={`p-1.5 rounded-lg ${contract.type === 'power' ? 'bg-warning/10 text-warning' : 'bg-secondary/10 text-secondary'}`}>
                                  {contract.type === 'power' ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                  ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.99 7.99 0 0120 13a7.98 7.99 0 01-2.343 5.657z" /></svg>
                                  )}
                                </div>
                            </div>
                          </div>
                        </div>

                        <div class="grid grid-cols-2 gap-4 pt-6 border-t border-base-content/5">
                          <div>
                            <p class="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">Base Price</p>
                            <p class="text-xl font-black">€{contract.basePrice.toFixed(2)}<span class="text-xs font-bold opacity-40 ml-1">/mo</span></p>
                          </div>
                          <div>
                            <p class="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">Working Price</p>
                            <p class="text-xl font-black">€{contract.workingPrice.toFixed(4)}<span class="text-xs font-bold opacity-40 ml-1">/{contract.type === 'power' ? 'kWh' : 'm³'}</span></p>
                          </div>
                        </div>

                        <div class="flex justify-end gap-1 mt-6 pt-4 border-t border-base-content/5">
                          <A 
                            href={`/contracts/${contract._id}/edit`} 
                            class="btn btn-ghost btn-xs rounded-lg font-bold opacity-40 hover:opacity-100 hover:bg-base-200" 
                            title="Edit Contract"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            <span class="text-[10px] uppercase tracking-tighter">Edit</span>
                          </A>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteContract(contract._id); }} 
                            class="btn btn-ghost btn-xs rounded-lg font-bold opacity-40 hover:opacity-100 hover:bg-error/10 hover:text-error" 
                            title="Delete Contract"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            <span class="text-[10px] uppercase tracking-tighter">Delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()}
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