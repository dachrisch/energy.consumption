import { Component, createResource, For, Show } from 'solid-js';
import { A } from '@solidjs/router';

const fetchMeters = async () => {
  const res = await fetch('/api/meters');
  if (!res.ok) throw new Error('Failed to fetch meters');
  return res.json();
};

const fetchDashboardData = async () => {
  const [metersRes, contractsRes] = await Promise.all([
    fetch('/api/meters'),
    fetch('/api/contracts')
  ]);
  return {
    meters: await metersRes.json(),
    contracts: await contractsRes.json()
  };
};

const Dashboard: Component = () => {
  const [data] = createResource(fetchDashboardData);

  return (
    <div class="p-6 md:p-10 lg:p-12 max-w-6xl mx-auto space-y-10">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 class="text-4xl font-black tracking-tighter">Your Dashboard</h1>
          <p class="text-base-content/60 font-bold">Overview of your energy infrastructure.</p>
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
                <div class="bg-base-200 p-6 rounded-full mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                </div>
                <h3 class="text-xl font-black opacity-40 uppercase tracking-widest">No meters found</h3>
                <p class="text-base-content/40 font-bold mb-6">Start your journey by adding your first utility meter.</p>
                <A href="/meters/add" class="btn btn-outline btn-wide rounded-2xl border-2">Add First Meter</A>
              </div>
            </div>
          }>
            {(meter) => {
              const hasContract = () => data()?.contracts.some((c: any) => c.meterId === meter._id);
              
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

                    <Show when={!hasContract()}>
                      <div class="bg-warning/5 border border-warning/20 p-4 rounded-xl mb-4">
                        <p class="text-[10px] font-black text-warning uppercase tracking-widest leading-none mb-1">Attention Required</p>
                        <p class="text-xs font-bold opacity-60">No contract linked. Cost analysis disabled.</p>
                        <A href="/contracts/add" class="btn btn-warning btn-xs btn-outline rounded-lg mt-3 font-black">Link Pricing</A>
                      </div>
                    </Show>
                    
                    <div class="card-actions justify-between items-center mt-auto pt-4 border-t border-base-content/5">
                      <A href={`/meters/${meter._id}/add-reading`} class="btn btn-primary btn-sm rounded-xl font-black px-6 text-xs h-10">Add Reading</A>
                      <A href={`/meters/${meter._id}`} class="btn btn-ghost btn-sm rounded-xl font-bold opacity-60 hover:opacity-100 text-xs">Details</A>
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

export default Dashboard;
