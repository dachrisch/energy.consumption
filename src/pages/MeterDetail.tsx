import { Component, createResource, Show, ErrorBoundary } from 'solid-js';
import { useParams, A } from '@solidjs/router';
import ConsumptionChart from '../components/ConsumptionChart';
import { calculateStats } from '../lib/consumption';
import { findContractForDate, calculateCostForContract } from '../lib/pricing';

const fetchMeterData = async (id: string) => {
  console.log(`[MeterDetail] Fetching data for: ${id}`);
  const [meterRes, readingsRes, contractsRes] = await Promise.all([
    fetch(`/api/meters?id=${id}`),
    fetch(`/api/readings?meterId=${id}`),
    fetch(`/api/contracts?meterId=${id}`)
  ]);
  
  const meterData = await meterRes.json();
  const readings = await readingsRes.json();
  const contracts = await contractsRes.json();
  
  console.log(`[MeterDetail] Data received. Readings: ${readings.length}, Contracts: ${contracts.length}`);
  
  return {
    meter: meterData.find((m: any) => m._id === id),
    readings,
    contracts
  };
};

const MeterDetail: Component = () => {
  const params = useParams();
  const [data] = createResource(() => params.id, fetchMeterData);

  const stats = () => {
    try {
      if (!data()?.readings) return { dailyAverage: 0, yearlyProjection: 0, estimatedYearlyCost: 0 };
      const consumptionStats = calculateStats(data()?.readings.map((r: any) => ({
        value: r.value,
        date: new Date(r.date)
      })));

      const activeContract = findContractForDate(data()?.contracts || [], new Date());
      let estimatedYearlyCost = 0;
      
      if (activeContract) {
        estimatedYearlyCost = calculateCostForContract({
          consumption: consumptionStats.yearlyProjection,
          days: 365.25,
          contract: activeContract
        });
      }

      return {
        ...consumptionStats,
        estimatedYearlyCost
      };
    } catch (err) {
      console.error('[MeterDetail] Stats calculation error:', err);
      return { dailyAverage: 0, yearlyProjection: 0, estimatedYearlyCost: 0 };
    }
  };

  return (
    <div class="p-6 md:p-10 lg:p-12 max-w-6xl mx-auto space-y-10 flex-1">
      <ErrorBoundary fallback={(err) => <div class="alert alert-error font-bold">Something went wrong rendering meter details: {err.message}</div>}>
        <Show when={data()?.meter} fallback={<div class="flex justify-center py-20"><span class="loading loading-spinner loading-lg text-primary"></span></div>}>
          <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div class="flex items-center gap-3 mb-2">
                <div class={`p-2 rounded-lg ${data()?.meter.type === 'power' ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'}`}>
                  {data()?.meter.type === 'power' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.99 7.99 0 0120 13a7.98 7.99 0 01-2.343 5.657z" /></svg>
                  )}
                </div>
                <span class="font-black text-xs uppercase tracking-[0.2em] opacity-40">{data()?.meter.meterNumber}</span>
              </div>
              <h1 class="text-5xl font-black tracking-tighter">{data()?.meter.name}</h1>
            </div>
            
            <div class="flex gap-3">
              <A href={`/meters/${data()?.meter._id}/add-reading`} class="btn btn-primary btn-md rounded-2xl shadow-xl shadow-primary/20 px-8">Add Reading</A>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="card bg-base-100 shadow-xl border border-base-content/5">
              <div class="card-body p-8">
                <p class="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">Daily Average</p>
                <p class="text-3xl font-black">{stats().dailyAverage.toFixed(2)}<span class="text-sm font-bold opacity-40 ml-2">{data()?.meter.unit}/day</span></p>
              </div>
            </div>
            <div class="card bg-base-100 shadow-xl border border-base-content/5">
              <div class="card-body p-8">
                <p class="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">Yearly Projection</p>
                <p class="text-3xl font-black">{Math.round(stats().yearlyProjection).toLocaleString()}<span class="text-sm font-bold opacity-40 ml-2">{data()?.meter.unit}/year</span></p>
              </div>
            </div>
            <div class="card bg-primary text-primary-content shadow-2xl shadow-primary/30 border-none">
              <div class="card-body p-8">
                <p class="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1 text-primary-content/80">Estimated Yearly Cost</p>
                <Show when={stats().estimatedYearlyCost > 0} fallback={<p class="text-xl font-black opacity-60">No active contract</p>}>
                  <p class="text-4xl font-black tracking-tighter">€{stats().estimatedYearlyCost.toFixed(2)}</p>
                </Show>
              </div>
            </div>
          </div>

          <div class="card bg-base-100 shadow-2xl border border-base-content/5 overflow-hidden">
            <div class="card-body p-8 md:p-12">
              <h2 class="text-xl font-black uppercase tracking-widest opacity-20 mb-8">Consumption Trend</h2>
              <ConsumptionChart readings={data()?.readings || []} unit={data()?.meter.unit} />
            </div>
          </div>
        </Show>
      </ErrorBoundary>
    </div>
  );
};

export default MeterDetail;