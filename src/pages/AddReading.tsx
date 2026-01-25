import { Component, createSignal, createResource, Show } from 'solid-js';
import { useNavigate, useParams } from '@solidjs/router';

const fetchMeter = async (id: string) => {
  const res = await fetch(`/api/meters?id=${id}`);
  const meters = await res.json();
  return meters.find((m: any) => m._id === id);
};

const AddReading: Component = () => {
  const params = useParams();
  const [value, setValue] = createSignal('');
  const [date, setDate] = createSignal(new Date().toISOString().split('T')[0]);
  const navigate = useNavigate();
  const [meter] = createResource(() => params.id, fetchMeter);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/readings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          meterId: params.id, 
          value: Number(value()), 
          date: new Date(date()) 
        }),
      });
      if (res.ok) {
        navigate(`/meters/${params.id}/readings`);
      } else {
        alert('Failed to add reading');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div class="p-6 md:p-10 lg:p-12 max-w-2xl mx-auto">
      <Show when={meter()} fallback={<div class="flex justify-center py-20"><span class="loading loading-spinner loading-lg text-primary"></span></div>}>
        <div class="mb-10">
          <div class="flex items-center gap-3 mb-2">
            <div class={`p-2 rounded-lg ${meter().type === 'power' ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'}`}>
              {meter().type === 'power' ? (
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.99 7.99 0 0120 13a7.98 7.99 0 01-2.343 5.657z" /></svg>
              )}
            </div>
            <span class="font-black text-xs uppercase tracking-[0.2em] opacity-40">{meter().meterNumber}</span>
          </div>
          <h1 class="text-4xl font-black tracking-tighter">Add Reading</h1>
          <p class="text-base-content/60 font-bold text-lg">Record current consumption for {meter().name}.</p>
        </div>
        
        <div class="card bg-base-100 shadow-2xl border border-base-content/5 overflow-hidden">
          <div class="card-body p-8 md:p-12">
            <form onSubmit={handleSubmit} class="space-y-8">
              <div class="form-control w-full flex flex-col gap-2">
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
