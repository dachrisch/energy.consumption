import { Component, createResource, For, Show, ErrorBoundary } from 'solid-js';
import { useParams, useSearchParams, A } from '@solidjs/router';
import { IMeter as Meter, IReading as Reading, IContract as Contract } from '../types/models';
import ConsumptionChart from '../components/ConsumptionChart';
import MeterTabs from '../components/MeterTabs';
import { findContractGaps, Gap } from '../lib/gapDetection';
import Icon from '../components/Icon';

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

const MeterDetailHeader: Component<{ meter: Meter }> = (props) => {
  const meterColor = () => props.meter.type === 'power' ? 'var(--color-meter-power)' : 'var(--color-meter-gas)';
  
  return (
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
      <div class="min-w-0 w-full">
        <div class="flex items-center gap-3 mb-2">
          <div 
            class="p-2 rounded-lg"
            style={{ "background-color": `color-mix(in srgb, ${meterColor()}, transparent 90%)`, "color": meterColor() }}
          >
            <Icon name={props.meter.type as 'power' | 'gas'} class="h-5 w-5" />
          </div>
          <span class="font-black text-xs uppercase tracking-[0.2em] opacity-40">{props.meter.meterNumber}</span>
        </div>
        <h1 class="text-3xl md:text-4xl font-black tracking-tighter break-words">{props.meter.name}</h1>
      </div>
      
      <div class="flex gap-3">
        <A href={`/meters/${props.meter._id}/readings`} class="btn btn-ghost btn-md rounded-xl border border-base-content/10 font-bold px-8">View History</A>
        <A href={`/meters/${props.meter._id}/add-reading`} class="btn btn-primary btn-md rounded-xl shadow-sm shadow-primary/20 px-8">Add reading</A>
      </div>
    </div>
  );
};

const supplierIdOf = (contract: Contract) =>
  typeof contract.supplierId === 'string' ? contract.supplierId : contract.supplierId?._id;

const MeterContracts: Component<{ contracts: Contract[], meterId: string }> = (props) => (
  <section class="card bg-base-100 shadow-sm border border-base-content/5" aria-label="Meter contracts">
    <div class="card-body p-6 md:p-8">
      <div class="flex items-center justify-between gap-4 mb-6">
        <h2 class="text-xl font-black tracking-tight">Contracts</h2>
        <A href={`/contracts/add?meterId=${props.meterId}`} class="btn btn-primary btn-sm rounded-xl font-bold">
          Add contract
        </A>
      </div>
      <Show when={props.contracts.length > 0} fallback={
        <p class="rounded-2xl border border-dashed border-base-content/10 p-6 text-sm font-bold opacity-50">
          No contracts configured for this meter.
        </p>
      }>
        <ul class="divide-y divide-base-content/5">
          <For each={props.contracts}>
            {(contract) => {
              const supplierId = supplierIdOf(contract);
              return (
                <li class="flex flex-wrap items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
                  <div>
                    <Show when={supplierId} fallback={<p class="font-black">{contract.providerName}</p>}>
                      <A href={`/contracts/${supplierId}`} class="link link-hover font-black hover:text-primary">
                        {contract.providerName}
                      </A>
                    </Show>
                    <p class="mt-1 text-xs font-bold opacity-50">
                      {new Date(contract.startDate).toLocaleDateString()} – {contract.endDate ? new Date(contract.endDate).toLocaleDateString() : 'Present'}
                    </p>
                  </div>
                  <A
                    href={`/contracts/${contract._id}/edit`}
                    class="btn btn-ghost btn-sm rounded-xl font-bold"
                    aria-label={`Edit ${contract.providerName} contract`}
                  >
                    Edit
                  </A>
                </li>
              );
            }}
          </For>
        </ul>
      </Show>
    </div>
  </section>
);

const MeterStatsGrid: Component<{ meter: Meter, stats: {
  dailyAverage: number;
  yearlyProjection: number;
  estimatedYearlyCost: number;
  dailyCost: number;
  gaps?: Gap[];
}, hasContracts: boolean }> = (props) => (
  <div class="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-6">
    <div class="card bg-base-100 shadow-sm border border-base-content/5">
      <div class="card-body p-5 md:p-8">
        <p class="text-[10px] font-bold uppercase tracking-wider opacity-40 mb-1">Daily Average</p>
        <p class="text-2xl font-black md:text-3xl">
          {props.stats.dailyAverage.toFixed(2)}
          <span class="block text-xs font-bold opacity-40 sm:inline sm:ml-2">{props.meter.unit}/day</span>
        </p>
        <Show when={props.stats.dailyCost > 0}>
          <p class="text-sm font-bold text-success mt-1">€{props.stats.dailyCost.toFixed(2)}/day</p>
        </Show>
      </div>
    </div>
    <div class="card bg-base-100 shadow-sm border border-base-content/5">
      <div class="card-body p-5 md:p-8">
        <p class="text-[10px] font-bold uppercase tracking-wider opacity-40 mb-1">Yearly Projection</p>
        <p class="text-2xl font-black md:text-3xl">
          {Math.round(props.stats.yearlyProjection).toLocaleString()}
          <span class="block text-xs font-bold opacity-40 sm:inline sm:ml-2">{props.meter.unit}/year</span>
        </p>
      </div>
    </div>
    <Show when={props.hasContracts && (props.stats.gaps?.length ?? 0) === 0} fallback={
      <div class="card col-span-2 bg-warning/10 text-warning border border-warning/20 shadow-sm md:col-span-1">
        <div class="card-body p-5 md:p-8">
          <p class="text-[10px] font-bold uppercase tracking-wider opacity-60 mb-1">Estimated Yearly Cost</p>
          <p class="text-xs font-bold mb-4">
            {props.stats.gaps && props.stats.gaps.length > 0 ? 'Coverage gaps detected.' : 'No contract configured for this meter.'}
          </p>
          <A 
            href={`/contracts/add?meterId=${props.meter._id}${props.stats.gaps && props.stats.gaps.length > 0 ? `&startDate=${props.stats.gaps[0].startDate.toISOString().split('T')[0]}&endDate=${props.stats.gaps[0].endDate.toISOString().split('T')[0]}` : ''}`} 
            class="btn btn-warning btn-sm rounded-xl font-black w-full"
          >
            {props.stats.gaps && props.stats.gaps.length > 0 ? 'Fill Coverage Gap' : 'Configure Pricing'}
          </A>
        </div>
      </div>
    }>
      <div class="card col-span-2 bg-primary text-primary-content shadow-sm shadow-primary/30 border-none relative overflow-hidden group md:col-span-1">
        <div class="card-body p-8 z-10">
          <p class="text-[10px] font-bold uppercase tracking-wider opacity-60 mb-1 text-primary-content/80">Estimated Yearly Cost</p>
          <p class="text-4xl font-black tracking-tighter">€{props.stats.estimatedYearlyCost.toFixed(2)}</p>
          <div class="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
            <span class="text-[10px] font-bold uppercase tracking-wider opacity-60">Active Contract</span>
            <A href={`/contracts?meterId=${props.meter._id}`} class="btn btn-xs btn-ghost bg-white/10 hover:bg-white/20 text-white rounded-xl border-none px-3 font-black">Manage</A>
          </div>
        </div>
        <div class="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
          <Icon name="reading" class="h-32 w-32" />
        </div>
      </div>
    </Show>
  </div>
);

const ConsumptionChartCard: Component<{ 
  meter: Meter, 
  readings: Reading[], 
  hasContracts: boolean 
}> = (props) => (
  <div class="card bg-base-100 shadow-sm border border-base-content/5 overflow-hidden">
    <div class="card-body p-8 md:p-12">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <h2 class="text-sm font-bold uppercase tracking-[0.18em] opacity-40">Daily consumption & projection</h2>
      </div>
      <ConsumptionChart 
        readings={props.readings} 
        projectionDays={365}
        unit={props.meter.unit} 
      />
    </div>
  </div>
);

const MeterDetail: Component = () => {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const [data] = createResource(() => params.id, fetchMeterData);
  const showContracts = () => searchParams.tab === 'contracts';

  const stats = () => {
    const meter = data()?.meter;
    // Use pre-calculated stats from backend.
    // If not available (e.g. for a very new meter or legacy data), we might show 0s or N/A
    // but the backend recalculation service should have run on any update.
    return {
        ...(meter?.stats || { dailyAverage: 0, yearlyProjection: 0, estimatedYearlyCost: 0, dailyCost: 0 }),
        gaps: findContractGaps(data()?.readings || [], data()?.contracts || [])
    };
  };

  return (
    <div class="p-4 md:p-10 lg:p-12 max-w-6xl mx-auto space-y-6 md:space-y-10 flex-1 min-w-0">
      <ErrorBoundary fallback={(err) => <div class="alert alert-error font-bold">Something went wrong rendering meter details: {err instanceof Error ? err.message : 'Unknown error'}</div>}>
        <Show when={data()?.meter} fallback={<div class="flex justify-center py-20"><span class="loading loading-spinner loading-lg text-primary"></span></div>}>
          <MeterDetailHeader meter={data()!.meter} />
          <MeterTabs meterId={data()!.meter._id} active={showContracts() ? 'contracts' : 'overview'} />
          <Show when={showContracts()} fallback={
            <>
              <MeterStatsGrid meter={data()!.meter} stats={stats()} hasContracts={(data()?.contracts?.length || 0) > 0} />
              <ConsumptionChartCard
                meter={data()!.meter}
                readings={data()?.readings || []}
                hasContracts={(data()?.contracts?.length || 0) > 0}
              />
            </>
          }>
            <MeterContracts contracts={data()?.contracts || []} meterId={data()!.meter._id} />
          </Show>
        </Show>
      </ErrorBoundary>
    </div>
  );
};

export default MeterDetail;
