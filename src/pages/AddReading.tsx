import { Component, createSignal, createResource, Show, createEffect, For } from 'solid-js';
import { useNavigate, useParams } from '@solidjs/router';

const fetchMeters = async () => {
  const res = await fetch('/api/meters');
  return res.json();
};

const AddReading: Component = () => {
  const params = useParams();
  const navigate = useNavigate();
  
  const [selectedMeterId, setSelectedMeterId] = createSignal(params.id || localStorage.getItem('lastMeterId') || '');
  const [value, setValue] = createSignal('');
  const [date, setDate] = createSignal(new Date().toISOString().split('T')[0]);
  
  const [meters] = createResource(fetchMeters);

  // Sync selectedMeterId if params.id changes (e.g. navigating from a specific meter)
  createEffect(() => {
    if (params.id) {
      setSelectedMeterId(params.id);
    }
  });

  const selectedMeter = () => meters()?.find((m: any) => m._id === selectedMeterId());

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    const meterId = selectedMeterId();
    if (!meterId) {
      alert('Please select a meter');
      return;
    }

    try {
      const res = await fetch('/api/readings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          meterId, 
          value: Number(value()), 
          date: new Date(date()) 
        }),
      });
      if (res.ok) {
        localStorage.setItem('lastMeterId', meterId);
        // If we came from a specific meter detail/readings page, go back there.
        // Otherwise go to the readings list for the selected meter.
        navigate(`/meters/${meterId}/readings`);
      } else {
        alert('Failed to add reading');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div class="p-6 md:p-10 lg:p-12 max-w-2xl mx-auto flex-1 flex flex-col justify-center">
      <Show when={!meters.loading} fallback={<div class="flex justify-center py-20"><span class="loading loading-spinner loading-lg text-primary"></span></div>}>
        <div class="mb-10 text-center md:text-left">
          <h1 class="text-4xl font-black tracking-tighter">Add Reading</h1>
          <p class="text-base-content/60 font-bold text-lg">Record current consumption for your utility.</p>
        </div>
        
        <div class="card bg-base-100 shadow-2xl border border-base-content/5 overflow-hidden">
          <div class="card-body p-8 md:p-12">
            <form onSubmit={handleSubmit} class="space-y-8">
              
              <div class="form-control w-full flex flex-col gap-2">
                <label class="px-1">
                  <span class="label-text font-black uppercase text-xs tracking-widest opacity-60">Select Meter</span>
                </label>
                <select 
                  class="select select-bordered h-14 rounded-2xl bg-base-200/50 border-none font-bold text-lg focus:ring-2 focus:ring-primary px-6"
                  value={selectedMeterId()}
                  onChange={(e) => setSelectedMeterId(e.currentTarget.value)}
                  required
                >
                  <option value="" disabled>Choose a meter...</option>
                  <For each={meters()}>
                    {(meter) => (
                      <option value={meter._id}>
                        {meter.name} ({meter.meterNumber})
                      </option>
                    )}
                  </For>
                </select>
              </div>

              <Show when={selectedMeter()}>
                {(meter) => (
                  <div class="form-control w-full flex flex-col gap-2 animate-in fade-in slide-in-from-top-2">
                    <label class="px-1">
                      <span class="label-text font-black uppercase text-xs tracking-widest opacity-60">Reading Value ({meter().unit})</span>
                    </label>
                    <div class="relative group">
                      <input 
                        type="number" 
                        step="0.01" 
                        placeholder="0.00" 
                        class="input input-bordered w-full h-20 rounded-2xl bg-base-200/50 border-none font-black text-4xl focus:ring-4 focus:ring-primary/20 text-center transition-all" 
                        value={value()} 
                        onInput={(e) => setValue(e.currentTarget.value)} 
                        required 
                        autofocus
                      />
                      <div class="absolute inset-y-0 right-6 flex items-center pointer-events-none">
                        <span class="text-xl font-black opacity-20 uppercase">{meter().unit}</span>
                      </div>
                    </div>
                  </div>
                )}
              </Show>

              <div class="form-control w-full flex flex-col gap-2">
                <label class="px-1">
                  <span class="label-text font-black uppercase text-xs tracking-widest opacity-60">Date of Reading</span>
                </label>
                <input 
                  type="date" 
                  class="input input-bordered h-14 rounded-2xl bg-base-200/50 border-none font-bold text-lg focus:ring-2 focus:ring-primary px-6" 
                  value={date()} 
                  onInput={(e) => setDate(e.currentTarget.value)} 
                  required 
                />
              </div>

              <div class="card-actions justify-end pt-6">
                <button type="button" onClick={() => navigate('/dashboard')} class="btn btn-ghost btn-lg px-10 font-bold rounded-2xl">Cancel</button>
                <button type="submit" class="btn btn-primary btn-lg px-12 font-black rounded-2xl shadow-xl shadow-primary/20">Save Reading</button>
              </div>
            </form>
          </div>
        </div>
      </Show>
    </div>
  );
};

export default AddReading;