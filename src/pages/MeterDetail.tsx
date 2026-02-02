import { Component, createResource, Show, ErrorBoundary } from 'solid-js';
import { useParams, A } from '@solidjs/router';
import { IMeter as Meter, IReading as Reading, IContract as Contract } from '../types/models';
import ConsumptionChart from '../components/ConsumptionChart';
import { calculateStats } from '../lib/consumption';
import { findContractForDate, calculateCostForContract, calculateIntervalCost, Contract as PricingContract } from '../lib/pricing';
import { calculateProjection } from '../lib/projectionUtils';

const fetchMeterData = async (id: string) => {
  const [meterRes, readingsRes, contractsRes] = await Promise.all([
    fetch(`/api/meters?id=${id}`),
    fetch(`/api/readings?meterId=${id}`),
    fetch(`/api/contracts?meterId=${id}`)
  ]);
  
  const meterData = await meterRes.json();
  const readings = await readingsRes.json();
  const contracts = await contractsRes.json();
  
  return {
    meter: meterData.find((m: Meter) => m._id === id),
    readings,
    contracts
  };
};

const MeterDetailHeader: Component<{ meter: Meter }> = (props) => (
  <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
    <div class="min-w-0 w-full">
      <div class="flex items-center gap-3 mb-2">
        <div class={`p-2 rounded-lg ${props.meter.type === 'power' ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'}`}>
          {props.meter.type === 'power' ? (
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.99 7.99 0 0120 13a7.98 7.99 0 01-2.343 5.657z" />
            </svg>
          )}
        </div>
        <span class="font-black text-xs uppercase tracking-[0.2em] opacity-40">{props.meter.meterNumber}</span>
      </div>
      <h1 class="text-3xl md:text-5xl font-black tracking-tighter break-words">{props.meter.name}</h1>
    </div>
    
    <div class="flex gap-3">
      <A href={`/meters/${props.meter._id}/readings`} class="btn btn-ghost btn-md rounded-2xl border border-base-content/10 font-bold px-8">View History</A>
      <A href={`/meters/${props.meter._id}/add-reading`} class="btn btn-primary btn-md rounded-2xl shadow-xl shadow-primary/20 px-8">Log Reading</A>
    </div>
  </div>
);

const MeterStatsGrid: Component<{ meter: Meter, stats: {
  dailyAverage: number;
  yearlyProjection: number;
  estimatedYearlyCost: number;
  dailyCost: number;
} }> = (props) => (
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <div class="card bg-base-100 shadow-xl border border-base-content/5">
      <div class="card-body p-8">
        <p class="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">Daily Average</p>
        <p class="text-3xl font-black">{props.stats.dailyAverage.toFixed(2)}<span class="text-sm font-bold opacity-40 ml-2">{props.meter.unit}/day</span></p>
        <Show when={props.stats.dailyCost > 0}>
          <p class="text-sm font-bold text-success mt-1">€{props.stats.dailyCost.toFixed(2)}/day</p>
        </Show>
      </div>
    </div>
    <div class="card bg-base-100 shadow-xl border border-base-content/5">
      <div class="card-body p-8">
        <p class="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">Yearly Projection</p>
        <p class="text-3xl font-black">{Math.round(props.stats.yearlyProjection).toLocaleString()}<span class="text-sm font-bold opacity-40 ml-2">{props.meter.unit}/year</span></p>
      </div>
    </div>
    <Show when={props.stats.estimatedYearlyCost > 0} fallback={
      <div class="card bg-warning/10 text-warning border border-warning/20 shadow-xl shadow-warning/5">
        <div class="card-body p-8">
          <p class="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Estimated Yearly Cost</p>
          <p class="text-xs font-bold mb-4">No contract configured for this meter.</p>
          <A href={`/contracts/add?meterId=${props.meter._id}`} class="btn btn-warning btn-sm rounded-xl font-black w-full">Configure Pricing</A>
        </div>
      </div>
    }>
      <div class="card bg-primary text-primary-content shadow-2xl shadow-primary/30 border-none">
        <div class="card-body p-8">
          <p class="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1 text-primary-content/80">Estimated Yearly Cost</p>
          <p class="text-4xl font-black tracking-tighter">€{props.stats.estimatedYearlyCost.toFixed(2)}</p>
        </div>
      </div>
    </Show>
  </div>
);

const MeterDetail: Component = () => {
  const params = useParams();
  const [data] = createResource(() => params.id, fetchMeterData);

  const calculateDailyCost = (readings: Reading[], contracts: Contract[]) => {
    if (readings.length < 2) {return 0;}
    const sorted = [...readings].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const last = sorted[0];
    const prev = sorted[1];
    const intervalDays = (new Date(last.date).getTime() - new Date(prev.date).getTime()) / (1000 * 60 * 60 * 24);
    
    if (intervalDays <= 0) {return 0;}
    const totalIntervalCost = calculateIntervalCost(
      new Date(prev.date),
      new Date(last.date),
      last.value - prev.value,
      contracts as unknown as PricingContract[] 
    );
    return totalIntervalCost / intervalDays;
  };

  const calculateYearlyCost = (contracts: Contract[], yearlyProjection: number) => {
    const activeContract = findContractForDate(contracts as unknown as PricingContract[], new Date());
    if (!activeContract) {return 0;}
    return calculateCostForContract({
      consumption: yearlyProjection,
      days: 365.25,
      contract: activeContract
    });
  };

  const stats = () => {
    try {
      if (!data()?.readings) {return { dailyAverage: 0, yearlyProjection: 0, estimatedYearlyCost: 0, dailyCost: 0 };}
      const readings = data()?.readings;
      const consumptionStats = calculateStats(readings.map((r: Reading) => ({
        value: r.value,
        date: new Date(r.date)
      })));

      return {
        ...consumptionStats,
        estimatedYearlyCost: calculateYearlyCost(data()?.contracts, consumptionStats.yearlyProjection),
        dailyCost: calculateDailyCost(readings, data()?.contracts)
      };
    } catch (err) {
      console.error('[MeterDetail] Stats calculation error:', err);
      return { dailyAverage: 0, yearlyProjection: 0, estimatedYearlyCost: 0, dailyCost: 0 };
    }
  };

  const projection = () => {
    const readings = data()?.readings;
    if (!readings) {return [];}
    return calculateProjection(readings, 365);
  };

  return (
    <div class="p-4 md:p-10 lg:p-12 max-w-6xl mx-auto space-y-6 md:space-y-10 flex-1 min-w-0">
      <ErrorBoundary fallback={(err) => <div class="alert alert-error font-bold">Something went wrong rendering meter details: {err instanceof Error ? err.message : 'Unknown error'}</div>}>
        <Show when={data()?.meter} fallback={<div class="flex justify-center py-20"><span class="loading loading-spinner loading-lg text-primary"></span></div>}>
          <MeterDetailHeader meter={data()?.meter} />
          <MeterStatsGrid meter={data()?.meter} stats={stats()} />

          <div class="card bg-base-100 shadow-2xl border border-base-content/5 overflow-hidden">
            <div class="card-body p-8 md:p-12">
              <h2 class="text-xl font-black uppercase tracking-widest opacity-20 mb-8">Consumption Trend & Projection</h2>
              <ConsumptionChart 
                readings={data()?.readings || []} 
                projection={projection()}
                unit={data()?.meter.unit} 
              />
            </div>
          </div>
        </Show>
      </ErrorBoundary>
    </div>
  );
};

export default MeterDetail;
