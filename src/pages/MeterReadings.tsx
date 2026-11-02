import { Component, createResource, For, Show, createSignal } from 'solid-js';
import { useParams, useSearchParams, A } from '@solidjs/router';
import { calculateDeltas } from '../lib/consumption';
import { useToast } from '../context/ToastContext';
import type { ToastType } from '../context/ToastContext';
import EmptyState from '../components/EmptyState';
import Icon from '../components/Icon';
import MeterTabs from '../components/MeterTabs';
import type { ReadingKind } from '../types/models';
import { formatDayMonth, formatNumber } from '../lib/format';

interface Meter {
  _id: string;
  name: string;
  unit: string;
}

interface Reading {
  _id: string;
  date: Date;
  value: number;
  delta?: number;
  source?: string;
  kind?: ReadingKind;
  anomaly?: 'decrease';
  isFirst?: boolean;
}

interface ApiReading {
  _id: string;
  value: number;
  date: string | Date;
  source?: string;
  kind?: ReadingKind;
}

const fetchMeterReadings = async (id: string) => {
  const [meterRes, readingsRes] = await Promise.all([
    fetch(`/api/meters?id=${id}`),
    fetch(`/api/readings?meterId=${id}`)
  ]);
  
  const meters = await meterRes.json();
  const readings: ApiReading[] = await readingsRes.json();
  
  return {
    meter: meters.find((m: Meter) => m._id === id),
    readings: calculateDeltas(readings.map((r: ApiReading) => ({
      ...r,
      date: new Date(r.date)
    }))) as Reading[]
  };
};

const ReadingDeltaCell: Component<{ reading: Reading; unit: string }> = (props) => {
  const status = () => {
    if (props.reading.isFirst) { return 'first'; }
    if (props.reading.kind === 'meterChange') { return 'meterChange'; }
    if (props.reading.anomaly === 'decrease') { return 'anomaly'; }
    return (props.reading.delta ?? 0) > 0 ? 'delta' : 'zero';
  };
  return (
    <>
      <Show when={status() === 'first'}><span class="badge badge-ghost font-bold text-[10px]">First reading</span></Show>
      <Show when={status() === 'meterChange'}><span class="badge badge-ghost font-bold text-[10px]">Meter change</span></Show>
      <Show when={status() === 'anomaly'}><span class="badge badge-warning font-bold text-[10px]">Lower than previous — check value</span></Show>
      <Show when={status() === 'zero'}><span class="text-lg font-black opacity-60">+0 {props.unit}</span></Show>
      <Show when={status() === 'delta'}>
        <div class="flex items-center gap-2">
          <span class="text-lg font-black">+{formatNumber(props.reading.delta ?? 0)}</span>
          <span class="text-[10px] font-bold opacity-40 uppercase tracking-tighter">{props.unit}</span>
        </div>
      </Show>
    </>
  );
};

const ReadingTableRow: Component<{
  reading: Reading;
  meterId: string;
  unit: string;
  isDeleting: boolean;
  highlighted: boolean;
  onDelete: (id: string) => void;
}> = (props) => (
  <tr
    class="hover:bg-base-200/30 transition-colors"
    classList={{
      'bg-primary/10': props.highlighted,
      'outline outline-2 -outline-offset-2 outline-primary/50': props.highlighted,
    }}
    ref={(element) => {
      if (props.highlighted) {
        setTimeout(() => element.scrollIntoView?.({ block: 'center', behavior: 'smooth' }), 0);
      }
    }}
  >
    <td class="p-6 text-center">
      <span class="font-mono font-bold opacity-60">
        {formatDayMonth(props.reading.date)}
      </span>
      <div class="text-[10px] font-black opacity-30 uppercase">{props.reading.date.getFullYear()}</div>
    </td>
    <td class="p-6">
      <div class="flex items-center gap-2 flex-wrap">
        <span class="text-xl font-black">{formatNumber(props.reading.value, 3)}</span>
        <Show when={props.reading.source === 'provider'}>
          <span class="badge badge-primary badge-outline badge-sm font-black text-[9px] uppercase tracking-widest">provider</span>
        </Show>
      </div>
    </td>
 <td class="p-6">
      <ReadingDeltaCell reading={props.reading} unit={props.unit} />
    </td>
    <td class="p-6 text-right whitespace-nowrap">
      <A
        href={`/meters/${props.meterId}/readings/${props.reading._id}/edit`}
        class="btn btn-ghost btn-sm font-black rounded-xl"
      >
        Edit
      </A>
      <button 
        onClick={() => props.onDelete(props.reading._id)} 
        class="btn btn-ghost btn-sm text-error font-black hover:bg-error/10 rounded-xl"
        disabled={props.isDeleting}
      >
        {props.isDeleting ? <span class="loading loading-spinner loading-xs"></span> : 'Delete'}
      </button>
    </td>
  </tr>
);

interface DeletionOptions {
  id: string;
  toast: { showToast: (msg: string, type?: ToastType, action?: { label: string; onClick: () => void }) => void };
  setPendingDeletions: (v: (prev: Set<string>) => Set<string>) => void;
  setDeleting: (v: string | null) => void;
  refetch: () => void;
}

const handleReadingDeletion = async (options: DeletionOptions) => {
  const { id, toast, setPendingDeletions, setDeleting, refetch } = options;
  setPendingDeletions(prev => new Set(prev).add(id));
  let undoClicked = false;
  
  toast.showToast('Reading deleted', 'info', {
    label: 'Undo',
    onClick: () => {
      undoClicked = true;
      setPendingDeletions(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  });

  setTimeout(async () => {
    if (undoClicked) {
      return;
    }
    setDeleting(id);
    try {
      const res = await fetch(`/api/readings/${id}`, { method: 'DELETE' });
      if (res.ok) {
        refetch();
      } else {
        toast.showToast('Failed to delete reading', 'error');
      }
    } catch (err) {
      console.error(err);
      toast.showToast('An error occurred while deleting', 'error');
    } finally {
      setDeleting(null);
      setPendingDeletions(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }, 5000);
};

const MeterReadings: Component = () => {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const [data, { refetch }] = createResource(() => params.id, fetchMeterReadings);
  const [deleting, setDeleting] = createSignal<string | null>(null);
  const [pendingDeletions, setPendingDeletions] = createSignal<Set<string>>(new Set());
  const toast = useToast();

  /** `?highlight=<readingId|YYYY-MM-DD>` marks the datapoint the user came for. */
  const highlightTarget = () => {
    const raw = searchParams.highlight;
    return Array.isArray(raw) ? raw[0] : raw;
  };

  const isHighlighted = (reading: Reading) => {
    const target = highlightTarget();
    if (!target) {
      return false;
    }
    return reading._id === target || reading.date.toISOString().slice(0, 10) === target;
  };

  const filteredReadings = () => {
    const d = data();
    if (!d) {
      return [];
    }
    const filtered = d.readings.filter((r: Reading) => !pendingDeletions().has(r._id));
    return calculateDeltas(filtered);
  };

  const onDelete = (id: string) => handleReadingDeletion({ id, toast, setPendingDeletions, setDeleting, refetch });



  return (
    <div class="p-6 md:p-10 lg:p-12 max-w-5xl mx-auto space-y-10 flex-1">
      <Show when={data()?.meter} fallback={<div class="flex justify-center py-20"><span class="loading loading-spinner loading-lg text-primary"></span></div>}>
         <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
           <div>
             <div class="flex items-center gap-3 mb-2">
               <A href={`/meters/${data()?.meter._id}`} class="btn btn-ghost btn-xs rounded-xl font-black uppercase tracking-widest opacity-40 hover:opacity-100 px-0">
                 ← {data()?.meter.name}
               </A>
             </div>
             <h1 class="text-3xl font-black tracking-tighter md:text-4xl">Reading history</h1>
           </div>
           
            <div class="flex gap-3 flex-wrap">
              <A href={`/meters/${data()?.meter._id}/add-reading`} class="btn btn-primary btn-md rounded-xl shadow-sm shadow-primary/20 px-8">
                Add reading
              </A>
            </div>
         </div>

        <MeterTabs meterId={data()!.meter._id} active="history" />

        <div class="card bg-base-100 shadow-sm border border-base-content/5 overflow-hidden">
          <Show when={filteredReadings().length > 0} fallback={
            <div class="p-8">
              <EmptyState 
                title="No readings recorded"
                description="Start tracking your consumption by adding your first reading."
                actionLabel="Add reading"
                actionLink={`/meters/${data()?.meter._id}/add-reading`}
                icon={<Icon name="reading" class="h-12 w-12" />}
              />
            </div>
          }>
            <div class="overflow-x-auto">
              <table class="table table-zebra w-full">
                <thead class="bg-base-200/50">
                  <tr>
                    <th class="font-black uppercase text-[10px] tracking-widest p-6 text-center w-32">Date</th>
                    <th class="font-black uppercase text-[10px] tracking-widest p-6">Value ({data()?.meter.unit})</th>
                    <th class="font-black uppercase text-[10px] tracking-widest p-6">Consumption</th>
                    <th class="font-black uppercase text-[10px] tracking-widest p-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                   <For each={filteredReadings() as unknown as Reading[]}>
                     {(reading: Reading) => (
                      <ReadingTableRow 
                        reading={reading} 
                        meterId={data()?.meter._id || ''}
                        unit={data()?.meter.unit || ''} 
                        isDeleting={deleting() === reading._id} 
                        highlighted={isHighlighted(reading)}
                        onDelete={onDelete} 
                      />
                    )}
                  </For>
                </tbody>
              </table>
            </div>
          </Show>
        </div>
      </Show>
    </div>
  );
};

export default MeterReadings;
