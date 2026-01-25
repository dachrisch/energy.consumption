import { Component, createSignal } from 'solid-js';
import { useNavigate } from '@solidjs/router';

const AddMeter: Component = () => {
  const [name, setName] = createSignal('');
  const [meterNumber, setMeterNumber] = createSignal('');
  const [type, setType] = createSignal('power');
  const [unit, setUnit] = createSignal('kWh');
  const navigate = useNavigate();

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/meters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name(), meterNumber: meterNumber(), type: type(), unit: unit() }),
      });
      if (res.ok) {
        navigate('/dashboard');
      } else {
        alert('Failed to add meter');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div class="p-6 md:p-10 lg:p-12 max-w-2xl mx-auto">
      <div class="mb-10">
        <h1 class="text-4xl font-black tracking-tighter">Add Meter</h1>
        <p class="text-base-content/60 font-bold text-lg">Add a new utility meter to track.</p>
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
              <button type="button" onClick={() => navigate('/dashboard')} class="btn btn-ghost btn-lg px-10 font-bold rounded-2xl">Cancel</button>
              <button type="submit" class="btn btn-primary btn-lg px-12 font-black rounded-2xl shadow-xl shadow-primary/20">Save Meter</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddMeter;
