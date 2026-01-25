import { Component, createSignal, createResource, For } from 'solid-js';
import { useNavigate } from '@solidjs/router';

const fetchMeters = async () => {
  const res = await fetch('/api/meters');
  return res.json();
};

const AddContract: Component = () => {
  const [providerName, setProviderName] = createSignal('');
  const [type, setType] = createSignal('power');
  const [startDate, setStartDate] = createSignal(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = createSignal('');
  const [basePrice, setBasePrice] = createSignal('');
  const [workingPrice, setWorkingPrice] = createSignal('');
  const [meterId, setMeterId] = createSignal('');
  
  const [meters] = createResource(fetchMeters);
  const navigate = useNavigate();

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerName: providerName(),
          type: type(),
          startDate: new Date(startDate()),
          endDate: endDate() ? new Date(endDate()) : null,
          basePrice: Number(basePrice()),
          workingPrice: Number(workingPrice()),
          meterId: meterId()
        }),
      });
      const data = await res.json();
      if (res.ok) {
        navigate('/contracts');
      } else {
        alert(data.error || 'Failed to add contract');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div class="p-6 md:p-10 lg:p-12 max-w-2xl mx-auto">
      <div class="mb-10">
        <h1 class="text-4xl font-black tracking-tighter">Add Contract</h1>
        <p class="text-base-content/60 font-bold text-lg">Enter your utility pricing details.</p>
      </div>

      <div class="card bg-base-100 shadow-2xl border border-base-content/5 overflow-hidden">
        <div class="card-body p-8 md:p-12">
          <form onSubmit={handleSubmit} class="space-y-8">
            <div class="form-control w-full flex flex-col gap-2">
              <label class="px-1"><span class="label-text font-black uppercase text-xs tracking-widest opacity-60">Provider Name</span></label>
              <input type="text" placeholder="e.g. Vattenfall, E.ON" class="input input-bordered h-14 rounded-2xl bg-base-200/50 border-none font-bold text-lg focus:ring-2 focus:ring-primary px-6" value={providerName()} onInput={(e) => setProviderName(e.currentTarget.value)} required />
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="form-control w-full flex flex-col gap-2">
                <label class="px-1"><span class="label-text font-black uppercase text-xs tracking-widest opacity-60">Utility Type</span></label>
                <select class="select select-bordered h-14 rounded-2xl bg-base-200/50 border-none font-bold text-lg focus:ring-2 focus:ring-primary px-6" value={type()} onChange={(e) => setType(e.currentTarget.value)}>
                  <option value="power">Power (Electricity)</option>
                  <option value="gas">Natural Gas</option>
                </select>
              </div>
              <div class="form-control w-full flex flex-col gap-2">
                <label class="px-1"><span class="label-text font-black uppercase text-xs tracking-widest opacity-60">Linked Meter</span></label>
                <select class="select select-bordered h-14 rounded-2xl bg-base-200/50 border-none font-bold text-lg focus:ring-2 focus:ring-primary px-6" value={meterId()} onChange={(e) => setMeterId(e.currentTarget.value)} required>
                  <option value="" disabled selected>Select a meter</option>
                  <For each={meters()?.filter((m: any) => m.type === type())}>
                    {(m) => <option value={m._id}>{m.name} ({m.meterNumber})</option>}
                  </For>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="form-control w-full flex flex-col gap-2">
                <label class="px-1"><span class="label-text font-black uppercase text-xs tracking-widest opacity-60">Start Date</span></label>
                <input type="date" class="input input-bordered h-14 rounded-2xl bg-base-200/50 border-none font-bold text-lg focus:ring-2 focus:ring-primary px-6" value={startDate()} onInput={(e) => setStartDate(e.currentTarget.value)} required />
              </div>
              <div class="form-control w-full flex flex-col gap-2">
                <label class="px-1"><span class="label-text font-black uppercase text-xs tracking-widest opacity-60">End Date (Optional)</span></label>
                <input type="date" class="input input-bordered h-14 rounded-2xl bg-base-200/50 border-none font-bold text-lg focus:ring-2 focus:ring-primary px-6" value={endDate()} onInput={(e) => setEndDate(e.currentTarget.value)} />
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <div class="form-control w-full flex flex-col gap-2">
                <label class="px-1"><span class="label-text font-black uppercase text-xs tracking-widest opacity-60">Base Price (€/month)</span></label>
                <input type="number" step="0.01" placeholder="10.00" class="input input-bordered h-14 rounded-2xl bg-base-200/50 border-none font-bold text-lg focus:ring-2 focus:ring-primary px-6" value={basePrice()} onInput={(e) => setBasePrice(e.currentTarget.value)} required />
              </div>
              <div class="form-control w-full flex flex-col gap-2">
                <label class="px-1"><span class="label-text font-black uppercase text-xs tracking-widest opacity-60">Working Price (€/{type() === 'power' ? 'kWh' : 'm³'})</span></label>
                <input type="number" step="0.0001" placeholder="0.3000" class="input input-bordered h-14 rounded-2xl bg-base-200/50 border-none font-bold text-lg focus:ring-2 focus:ring-primary px-6" value={workingPrice()} onInput={(e) => setWorkingPrice(e.currentTarget.value)} required />
              </div>
            </div>

            <div class="card-actions justify-end pt-6">
              <button type="button" onClick={() => navigate('/contracts')} class="btn btn-ghost btn-lg px-10 font-bold rounded-2xl">Cancel</button>
              <button type="submit" class="btn btn-primary btn-lg px-12 font-black rounded-2xl shadow-xl shadow-primary/20">Save Contract</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddContract;
