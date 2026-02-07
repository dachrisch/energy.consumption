import { Component, createResource, For, Show, createSignal } from 'solid-js';
import { useParams, A } from '@solidjs/router';
import { calculateDeltas } from '../lib/consumption';
import { useToast } from '../context/ToastContext';
import EmptyState from '../components/EmptyState';
import Icon from '../components/Icon';

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
}

interface ApiReading {
  _id: string;
  value: number;
  date: string | Date;
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

const ReadingTableRow: Component<{
  reading: Reading;
  unit: string;
  isDeleting: boolean;
  onDelete: (id: string) => void;
}> = (props) => (
  <tr class="hover:bg-base-200/30 transition-colors">
    <td class="p-6 text-center">
      <span class="font-mono font-bold opacity-60">
        {props.reading.date.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' })}
      </span>
      <div class="text-[10px] font-black opacity-30 uppercase">{props.reading.date.getFullYear()}</div>
    </td>
    <td class="p-6">
      <span class="text-xl font-black">{props.reading.value.toLocaleString()}</span>
    </td>
     <td class="p-6">
       <Show when={(props.reading.delta ?? 0) > 0} fallback={<span class="badge badge-ghost opacity-30 font-black text-[10px]">INITIAL</span>}>
         <div class="flex items-center gap-2">
           <span class="text-lg font-black text-secondary">+{(props.reading.delta ?? 0).toLocaleString()}</span>
           <span class="text-[10px] font-bold opacity-40 uppercase tracking-tighter">{props.unit}</span>
         </div>
       </Show>
     </td>
    <td class="p-6 text-right">
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
  toast: { showToast: (msg: string, type: string, action?: { label: string; onClick: () => void }) => void };
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
  const [data, { refetch }] = createResource(() => params.id, fetchMeterReadings);
  const [deleting, setDeleting] = createSignal<string | null>(null);
  const [pendingDeletions, setPendingDeletions] = createSignal<Set<string>>(new Set());
  const toast = useToast();

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
               <A href={`/meters/${data()?.meter._id}`} class="btn btn-ghost btn-xs rounded-lg font-black uppercase tracking-widest opacity-40 hover:opacity-100 px-0">
                 ← {data()?.meter.name}
               </A>
             </div>
             <h1 class="text-5xl font-black tracking-tighter">Reading History</h1>
           </div>
           
            <div class="flex gap-3 flex-wrap">
              <A href={`/meters/${data()?.meter._id}/add-reading`} class="btn btn-primary btn-md rounded-2xl shadow-xl shadow-primary/20 px-8">
                Add New Entry
              </A>
            </div>
         </div>

        <div class="card bg-base-100 shadow-2xl border border-base-content/5 overflow-hidden">
          <Show when={filteredReadings().length > 0} fallback={
            <div class="p-8">
              <EmptyState 
                title="No readings recorded"
                description="Start tracking your consumption by adding your first reading."
                actionLabel="Add Reading"
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
                        unit={data()?.meter.unit || ''} 
                        isDeleting={deleting() === reading._id} 
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
