import { Component, createSignal, createResource, onMount, Show } from 'solid-js';
import { useNavigate, useParams } from '@solidjs/router';
import { useToast } from '../context/ToastContext';

const fetchMeter = async (id: string) => {
  const res = await fetch(`/api/meters?id=${id}`);
  const data = await res.json();
  return Array.isArray(data) ? data.find(m => m._id === id) : data;
};

const AddMeter: Component = () => {
  const params = useParams();
  const isEdit = () => !!params.id;
  const toast = useToast();
  
  const [name, setName] = createSignal('');
  const [meterNumber, setMeterNumber] = createSignal('');
  const [type, setType] = createSignal('power');
  const [unit, setUnit] = createSignal('kWh');
  const [meter] = createResource(() => params.id, fetchMeter);
  
  const navigate = useNavigate();

  onMount(() => {
    if (isEdit()) {
      // Data will be set via the createResource effect below
    }
  });

  // Sync resource data to signals
  const syncData = (data: any) => {
    if (data) {
      setName(data.name);
      setMeterNumber(data.meterNumber);
      setType(data.type);
      setUnit(data.unit);
    }
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    const url = isEdit() ? `/api/meters/${params.id}` : '/api/meters';
    const method = isEdit() ? 'PATCH' : 'POST';
    
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name(), meterNumber: meterNumber(), type: type(), unit: unit() }),
      });
      if (res.ok) {
        toast.showToast(`Meter ${isEdit() ? 'updated' : 'saved'} successfully`, 'success');
        navigate('/meters');
      } else {
        toast.showToast('Failed to save meter', 'error');
      }
    } catch (err) {
      console.error(err);
      toast.showToast('An error occurred while saving the meter', 'error');
    }
  };

  return (
    <div class="p-6 md:p-10 lg:p-12 max-w-2xl mx-auto flex-1 flex flex-col justify-center">
      <Show when={!isEdit() || !meter.loading} fallback={<div class="flex justify-center py-20"><span class="loading loading-spinner loading-lg text-primary"></span></div>}>
        <div class="mb-10">
          <h1 class="text-4xl font-black tracking-tighter">{isEdit() ? 'Edit Meter' : 'Add Meter'}</h1>
          <p class="text-base-content/60 font-bold text-lg">{isEdit() ? 'Update your utility meter details.' : 'Add a new utility meter to track.'}</p>
        </div>

        <div class="card bg-base-100 shadow-2xl border border-base-content/5 overflow-hidden">
          <div class="card-body p-8 md:p-12">
            <form onSubmit={handleSubmit} class="space-y-8">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="form-control w-full flex flex-col gap-2">
                  <label class="px-1"><span class="label-text font-black uppercase text-xs tracking-widest opacity-60">Meter Name</span></label>
                  <input type="text" placeholder="e.g. Main Electricity" class="input input-bordered h-14 rounded-2xl bg-base-200/50 border-none font-bold text-lg focus:ring-2 focus:ring-primary px-6" value={name()} onInput={(e) => setName(e.currentTarget.value)} required />
                </div>
                <div class="form-control w-full flex flex-col gap-2">
                  <label class="px-1"><span class="label-text font-black uppercase text-xs tracking-widest opacity-60">Meter Number</span></label>
                  <input type="text" placeholder="F012345" class="input input-bordered h-14 rounded-2xl bg-base-200/50 border-none font-bold text-lg focus:ring-2 focus:ring-primary px-6" value={meterNumber()} onInput={(e) => setMeterNumber(e.currentTarget.value)} required />
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="form-control w-full flex flex-col gap-2">
                  <label class="px-1"><span class="label-text font-black uppercase text-xs tracking-widest opacity-60">Utility Type</span></label>
                  <select class="select select-bordered h-14 rounded-2xl bg-base-200/50 border-none font-bold text-lg focus:ring-2 focus:ring-primary px-6" value={type()} onChange={(e) => {
                    setType(e.currentTarget.value);
                    setUnit(e.currentTarget.value === 'power' ? 'kWh' : 'm³');
                  }}>
                    <option value="power">Power (Electricity)</option>
                    <option value="gas">Natural Gas</option>
                  </select>
                </div>
                <div class="form-control w-full flex flex-col gap-2">
                  <label class="px-1"><span class="label-text font-black uppercase text-xs tracking-widest opacity-60">Reporting Unit</span></label>
                  <input type="text" class="input input-bordered h-14 rounded-2xl bg-base-200/50 border-none font-bold text-lg focus:ring-2 focus:ring-primary px-6" value={unit()} onInput={(e) => setUnit(e.currentTarget.value)} required />
                </div>
              </div>

              <div class="card-actions justify-end pt-6">
                <button type="button" onClick={() => navigate('/meters')} class="btn btn-ghost btn-lg px-10 font-bold rounded-2xl">Cancel</button>
                <button type="submit" class="btn btn-primary btn-lg px-12 font-black rounded-2xl shadow-xl shadow-primary/20">
                  {isEdit() ? 'Update Meter' : 'Save Meter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Show>
    </div>
  );
};

export default AddMeter;