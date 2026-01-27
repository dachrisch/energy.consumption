import { Component, createResource, For, Show, createSignal } from 'solid-js';
import { useParams, A } from '@solidjs/router';
import { calculateDeltas } from '../lib/consumption';
import { useToast } from '../context/ToastContext';

const fetchMeterReadings = async (id: string) => {
  const [meterRes, readingsRes] = await Promise.all([
    fetch(`/api/meters?id=${id}`),
    fetch(`/api/readings?meterId=${id}`)
  ]);
  
  const meters = await meterRes.json();
  const readings = await readingsRes.json();
  
  return {
    meter: meters.find((m: any) => m._id === id),
    readings: calculateDeltas(readings.map((r: any) => ({
      ...r,
      date: new Date(r.date)
    })))
  };
};

const MeterReadings: Component = () => {
  const params = useParams();
  const [data, { refetch }] = createResource(() => params.id, fetchMeterReadings);
  const [deleting, setDeleting] = createSignal<string | null>(null);
  const [pendingDeletions, setPendingDeletions] = createSignal<Set<string>>(new Set());
  const toast = useToast();

  const filteredReadings = () => {
    const d = data();
    if (!d) {return [];}
    // Filter out pending deletions and re-calculate deltas to fill gaps
    const filtered = d.readings.filter((r: any) => !pendingDeletions().has(r._id));
    return calculateDeltas(filtered);
  };

  const handleDelete = async (id: string) => {
    // Add to pending set to hide from UI immediately
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
      if (undoClicked) {return;}
      
      setDeleting(id);
      try {
        const res = await fetch(`/api/readings/${id}`, { method: 'DELETE' });
        if (res.ok) {
          refetch();
        } else {
          toast.showToast('Failed to delete reading', 'error');
          // Restore if failed
          setPendingDeletions(prev => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
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
          
          <A href={`/meters/${data()?.meter._id}/add-reading`} class="btn btn-primary btn-md rounded-2xl shadow-xl shadow-primary/20 px-8">
            Add New Entry
          </A>
        </div>

        <div class="card bg-base-100 shadow-2xl border border-base-content/5 overflow-hidden">
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
                <For each={filteredReadings()} fallback={
                  <tr>
                    <td colspan="4" class="py-20 text-center font-bold opacity-40 text-lg">No readings recorded yet.</td>
                  </tr>
                }>
                  {(reading: any) => (
                    <tr class="hover:bg-base-200/30 transition-colors">
                      <td class="p-6 text-center">
                        <span class="font-mono font-bold opacity-60">
                          {reading.date.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' })}
                        </span>
                        <div class="text-[10px] font-black opacity-30 uppercase">{reading.date.getFullYear()}</div>
                      </td>
                      <td class="p-6">
                        <span class="text-xl font-black">{reading.value.toLocaleString()}</span>
                      </td>
                      <td class="p-6">
                        <Show when={reading.delta > 0} fallback={<span class="badge badge-ghost opacity-30 font-black text-[10px]">INITIAL</span>}>
                          <div class="flex items-center gap-2">
                            <span class="text-lg font-black text-secondary">+{reading.delta.toLocaleString()}</span>
                            <span class="text-[10px] font-bold opacity-40 uppercase tracking-tighter">{data()?.meter.unit}</span>
                          </div>
                        </Show>
                      </td>
                      <td class="p-6 text-right">
                        <button 
                          onClick={() => handleDelete(reading._id)} 
                          class="btn btn-ghost btn-sm text-error font-black hover:bg-error/10 rounded-xl"
                          disabled={deleting() === reading._id}
                        >
                          {deleting() === reading._id ? <span class="loading loading-spinner loading-xs"></span> : 'Delete'}
                        </button>
                      </td>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </div>
        </div>
      </Show>
    </div>
  );
};

export default MeterReadings;
