import { Component, createResource, Show } from 'solid-js';
import { A } from '@solidjs/router';

const fetchAggregates = async () => {
  const res = await fetch('/api/aggregates');
  if (!res.ok) throw new Error('Failed to fetch aggregates');
  return res.json();
};

const Dashboard: Component = () => {
  const [data] = createResource(fetchAggregates);

  return (
    <div class="p-6 md:p-10 lg:p-12 max-w-6xl mx-auto space-y-10 flex-1">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 class="text-4xl font-black tracking-tighter">Financial Cockpit</h1>
          <p class="text-base-content/60 font-bold">Aggregated insights across all your energy sources.</p>
        </div>
        <div class="flex gap-2">
           <A href="/add-reading" class="btn btn-primary btn-md rounded-2xl shadow-xl shadow-primary/20 px-8 text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 4v16m8-8H4" /></svg>
            Quick Add Reading
          </A>
        </div>
      </div>

      <Show when={!data.loading} fallback={<div class="flex justify-center py-20"><span class="loading loading-spinner loading-lg text-primary"></span></div>}>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="card bg-primary text-primary-content shadow-2xl p-8 rounded-3xl relative overflow-hidden group">
            <div class="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-700"></div>
            <div class="relative z-10">
              <p class="text-xs font-black uppercase tracking-[0.2em] opacity-70 mb-2">Total Projected Yearly Cost</p>
              <h2 class="text-6xl font-black tracking-tighter mb-6">€{Math.round(data()?.totalYearlyCost || 0)}</h2>
              <div class="grid grid-cols-2 gap-4 pt-6 border-t border-white/10">
                <div>
                  <p class="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Power</p>
                  <p class="text-xl font-black">€{Math.round(data()?.powerYearlyCost || 0)}</p>
                </div>
                <div>
                  <p class="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Gas</p>
                  <p class="text-xl font-black">€{Math.round(data()?.gasYearlyCost || 0)}</p>
                </div>
              </div>
            </div>
          </div>

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
        </div>
      </Show>
    </div>
  );
};

export default Dashboard;