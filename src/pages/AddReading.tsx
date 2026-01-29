import { Component, createSignal, createResource, Show, createEffect, For } from 'solid-js';
import { useNavigate, useParams, A } from '@solidjs/router';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface Meter {
  _id: string;
  name: string;
  meterNumber: string;
  unit: string;
}

const fetchMeters = async () => {
  const res = await fetch('/api/meters');
  return res.json();
};

const AddReading: Component = () => {
  const params = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const auth = useAuth();

  const [selectedMeterId, setSelectedMeterId] = createSignal(params.id || localStorage.getItem('lastMeterId') || '');
  const [value, setValue] = createSignal('');
  const [date, setDate] = createSignal(new Date().toISOString().split('T')[0]);
  const [isScanning, setIsScanning] = createSignal(false);
  const [scanPreview, setScanPreview] = createSignal<string | null>(null);

  const [meters, { refetch }] = createResource<Meter[]>(fetchMeters);

  // Sync selectedMeterId if params.id changes (e.g. navigating from a specific meter)
  createEffect(() => {
    if (params.id) {
      setSelectedMeterId(params.id);
    }
  });

  // Auto-select if only one meter exists or if lastMeterId is valid
  createEffect(() => {
    const list = meters();
    if (!list || list.length === 0) { return; }

    const current = selectedMeterId();
    // If we already have a valid selection, do nothing
    if (current && list.find((m: Meter) => m._id === current)) { return; }

    // Try to find a default
    if (list.length === 1) {
      setSelectedMeterId(list[0]._id);
      return;
    }

    const lastId = localStorage.getItem('lastMeterId');
    if (lastId && list.find((m: Meter) => m._id === lastId)) {
      setSelectedMeterId(lastId);
    }
  });

  const handleScan = async (e: Event) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) { return; }

    // Show preview
    const reader = new FileReader();
    reader.onload = (re) => setScanPreview(re.target?.result as string);
    reader.readAsDataURL(file);

    setIsScanning(true);
    try {
      // Convert File to Base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = (re) => resolve(re.target?.result as string);
        r.onerror = () => reject(new Error('Failed to read file'));
        r.readAsDataURL(file);
      });

      const res = await fetch('/api/ocr/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64 })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || `OCR failed with status: ${res.status}`);
      }

      const result = await res.json();
      setValue(result.value.toString());

      // Auto-match/create meter logic
      if (result.meterId) {
        // If we found a different meter or created one, let's switch to it
        if (result.meterId !== selectedMeterId()) {
          setSelectedMeterId(result.meterId);
          // Refetch meters to show the new one in the list if it was created
          refetch();
          const typeLabel = result.type === 'power' ? '⚡ Power' : '🔥 Gas';
          toast.showToast(`Matched to ${typeLabel} meter: ${result.meterName}`, 'info');
        }
      }

      toast.showToast('Reading detected!', 'success');
    } catch (err) {
      toast.showToast(err instanceof Error ? err.message : 'OCR failed', 'error');
    } finally {
      setIsScanning(false);
    }
  };

  const selectedMeter = () => {
    const list = meters();
    if (!list) {return undefined;}
    return list.find((m: Meter) => m._id === selectedMeterId());
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    const meterId = selectedMeterId();
    if (!meterId) {
      toast.showToast('Please select a meter', 'warning');
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
        toast.showToast('Reading saved successfully', 'success');
        // If we came from a specific meter detail/readings page, go back there.
        // Otherwise go to the readings list for the selected meter.
        navigate(`/meters/${meterId}/readings`);
      } else {
        toast.showToast('Failed to add reading', 'error');
      }
    } catch (err) {
      console.error(err);
      toast.showToast('An error occurred while saving', 'error');
    }
  };

  return (
    <div class="p-6 md:p-10 lg:p-12 max-w-2xl mx-auto flex-1 flex flex-col justify-center">
      <Show when={!meters.loading} fallback={<div class="flex justify-center py-20"><span class="loading loading-spinner loading-lg text-primary"></span></div>}>
        <Show when={meters() && meters().length > 0} fallback={
          <div class="card bg-base-100 shadow-2xl border border-base-content/5 p-12 rounded-3xl text-center space-y-6">
            <div class="bg-base-200 p-6 rounded-full w-24 h-24 flex items-center justify-center mx-auto text-base-content/20">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            </div>
            <div>
              <h2 class="text-2xl font-black tracking-tighter">No Meters Found</h2>
              <p class="text-base-content/60 font-bold mb-4">You need at least one meter before you can log readings.</p>

              <div class="flex flex-col gap-3 items-center">
                <div class="relative w-full max-w-xs">
                  <input type="file" accept="image/*" capture class="hidden" id="photo-input-empty" onChange={handleScan} />
                  <label for="photo-input-empty" class="btn btn-outline btn-primary btn-lg rounded-2xl w-full gap-3">
                    <Show when={isScanning()} fallback={
                      <><svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg> Scan Photo to Start</>
                    }>
                      <span class="loading loading-spinner loading-md"></span> Scanning...
                    </Show>
                  </label>
                </div>
                <div class="divider text-[10px] font-black opacity-20 uppercase tracking-widest">or</div>
                <A href="/meters/add" class="btn btn-ghost btn-lg rounded-2xl opacity-60 hover:opacity-100">Add Manually</A>
              </div>
            </div>

            <Show when={!auth.user()?.googleApiKey}>
              <div class="bg-primary/5 p-4 rounded-2xl border border-primary/10 transition-all hover:bg-primary/10">
                <p class="text-xs font-bold text-primary flex items-center justify-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span>AI Scanning is disabled</span>
                </p>
                <A href="/profile" class="text-[10px] font-black uppercase text-primary underline mt-1 block">Enable OCR in Profile</A>
              </div>
            </Show>
          </div>
        }>
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
                      <div class="flex justify-between items-end px-1">
                        <label>
                          <span class="label-text font-black uppercase text-xs tracking-widest opacity-60">Reading Value ({meter().unit})</span>
                        </label>
                        <Show when={!auth.user()?.googleApiKey && !isScanning()}>
                          <div class="animate-in fade-in slide-in-from-right-2">
                            <A href="/profile" class="text-[10px] font-black uppercase text-primary/40 hover:text-primary transition-colors flex items-center gap-1">
                              <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              Enable AI Scanning
                            </A>
                          </div>
                        </Show>
                      </div>

                      <div class="flex gap-3 items-start">
                        <div class="relative flex-1 group">
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

                        <div class="relative">
                          <input type="file" accept="image/*" capture class="hidden" id="photo-input" onChange={handleScan} />
                          <label for="photo-input" class="btn btn-primary h-20 w-20 rounded-2xl flex flex-col gap-1 items-center justify-center p-0 shadow-lg shadow-primary/20" title="Take a photo of the meter">
                            <Show when={isScanning()} fallback={
                              <>
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span class="text-[10px] font-black uppercase tracking-tighter">Scan</span>
                              </>
                            }>
                              <span class="loading loading-spinner loading-md"></span>
                            </Show>
                          </label>
                        </div>
                      </div>

                      <Show when={scanPreview()}>
                        <div class="mt-2 flex justify-center">
                          <div class="relative">
                            <img src={scanPreview()!} class="h-24 w-auto rounded-lg border-2 border-primary/20 shadow-md" />
                            <button type="button" class="btn btn-circle btn-xs absolute -top-2 -right-2 btn-error" onClick={() => setScanPreview(null)}>✕</button>
                          </div>
                        </div>
                      </Show>
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
      </Show>
    </div>
  );
};

export default AddReading;