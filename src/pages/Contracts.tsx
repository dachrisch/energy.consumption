import { Component, createResource, For, Show } from 'solid-js';
import { A } from '@solidjs/router';

const fetchContracts = async () => {
  const res = await fetch('/api/contracts');
  if (!res.ok) throw new Error('Failed to fetch contracts');
  return res.json();
};

const Contracts: Component = () => {
  const [contracts] = createResource(fetchContracts);

  return (
    <div class="p-6 md:p-10 lg:p-12 max-w-6xl mx-auto space-y-10">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 class="text-4xl font-black tracking-tighter">Utility Contracts</h1>
          <p class="text-base-content/60 font-bold text-lg">Manage your energy provider pricing.</p>
        </div>
        <A href="/contracts/add" class="btn btn-primary btn-md rounded-2xl shadow-xl shadow-primary/20 px-8">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 4v16m8-8H4" /></svg>
          Add Contract
        </A>
      </div>

      <Show when={!contracts.loading} fallback={<div class="flex justify-center py-20"><span class="loading loading-spinner loading-lg text-primary"></span></div>}>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <For each={contracts()} fallback={
            <div class="col-span-full card bg-base-100 border border-dashed border-base-content/20 py-20 text-center">
              <div class="card-body items-center text-center">
                <div class="bg-base-200 p-6 rounded-full mb-4 text-base-content/20">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <h3 class="text-xl font-black opacity-40 uppercase tracking-widest">No contracts defined</h3>
                <p class="text-base-content/40 font-bold mb-6 max-w-sm">Enter your contract details to enable precise cost projections and historical analysis.</p>
                <A href="/contracts/add" class="btn btn-outline btn-wide rounded-2xl border-2">Register First Contract</A>
              </div>
            </div>
          }>
            {(contract) => (
              <div class="card bg-base-100 shadow-xl border border-base-content/5 overflow-hidden">
                <div class="card-body p-8">
                  <div class="flex justify-between items-start mb-6">
                    <div class={`p-3 rounded-2xl ${contract.type === 'power' ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'}`}>
                      {contract.type === 'power' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.99 7.99 0 0120 13a7.98 7.99 0 01-2.343 5.657z" /></svg>
                      )}
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
                  <p class="text-xs font-bold opacity-40 uppercase tracking-widest mb-6">Linked to Meter: {contract.meterId}</p>

                  <div class="grid grid-cols-2 gap-4 pt-6 border-t border-base-content/5">
                    <div>
                      <p class="text-[10px] font-black uppercase tracking-widest opacity-40">Base Price</p>
                      <p class="text-xl font-black">€{contract.basePrice.toFixed(2)}<span class="text-xs font-bold opacity-40 ml-1">/mo</span></p>
                    </div>
                    <div>
                      <p class="text-[10px] font-black uppercase tracking-widest opacity-40">Working Price</p>
                      <p class="text-xl font-black">€{contract.workingPrice.toFixed(4)}<span class="text-xs font-bold opacity-40 ml-1">/{contract.type === 'power' ? 'kWh' : 'm³'}</span></p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
};

export default Contracts;
