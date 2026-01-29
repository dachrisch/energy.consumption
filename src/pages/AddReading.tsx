import { Component, createSignal, createResource, Show, createEffect, For } from 'solid-js';
import { useNavigate, useParams } from '@solidjs/router';
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

interface ScanResult {
  value: number;
  meterId: string;
  meterName: string;
  type: string;
  unit: string;
}

const AddReading: Component = () => {
  const params = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const auth = useAuth();

  const [showForm, setShowForm] = createSignal(!!params.id);
  const [selectedMeterId, setSelectedMeterId] = createSignal(params.id || localStorage.getItem('lastMeterId') || '');
  const [value, setValue] = createSignal('');
  const [date, setDate] = createSignal(new Date().toISOString().split('T')[0]);
  const [isScanning, setIsScanning] = createSignal(false);
  const [scanPreview, setScanPreview] = createSignal<string | null>(null);
  const [pendingScan, setPendingScan] = createSignal<null | { value: number, meterId: string, meterName: string, type: string, unit: string }>(null);

  const [meters, { refetch }] = createResource<Meter[]>(fetchMeters);

  // Sync selectedMeterId if params.id changes
  createEffect(() => {
    if (params.id) {
      setSelectedMeterId(params.id);
      setShowForm(true);
    }
  });

  // Auto-select logic
  createEffect(() => {
    const list = meters();
    if (!list || list.length === 0) { return; }

    const current = selectedMeterId();
    if (current && list.find((m: Meter) => m._id === current)) { return; }

    if (list.length === 1) {
      setSelectedMeterId(list[0]._id);
      return;
    }

    const lastId = localStorage.getItem('lastMeterId');
    if (lastId && list.find((m: Meter) => m._id === lastId)) {
      setSelectedMeterId(lastId);
    }
  });

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (re) => resolve(re.target?.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const processScanResult = (result: ScanResult) => {
    const currentId = selectedMeterId();
    setShowForm(true);
    
    if (currentId && result.meterId && result.meterId !== currentId) {
      setPendingScan(result);
      toast.showToast('Photo matches a different meter', 'warning');
      return;
    }

    setValue(result.value.toString());
    if (result.meterId) {
      setSelectedMeterId(result.meterId);
      refetch();
      const typeLabel = result.type === 'power' ? '⚡ Power' : '🔥 Gas';
      toast.showToast(`Matched to ${typeLabel} meter: ${result.meterName}`, 'info');
    }
    toast.showToast('Reading detected!', 'success');
  };

  const handleScan = async (e: Event) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) { return; }

    const reader = new FileReader();
    reader.onload = (re) => setScanPreview(re.target?.result as string);
    reader.readAsDataURL(file);

    setIsScanning(true);
    setPendingScan(null);

    try {
      const base64 = await fileToBase64(file);
      const res = await fetch('/api/ocr/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64 })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || `OCR failed with status: ${res.status}`);
      }

      processScanResult(await res.json());
    } catch (err) {
      toast.showToast(err instanceof Error ? err.message : 'OCR failed', 'error');
    } finally {
      setIsScanning(false);
    }
  };

  const resolveMismatch = (useDetected: boolean) => {
    const scan = pendingScan();
    if (!scan) { return; }

    if (useDetected) {
      setSelectedMeterId(scan.meterId);
      refetch();
      const typeLabel = scan.type === 'power' ? '⚡ Power' : '🔥 Gas';
      toast.showToast(`Switched to ${typeLabel} meter: ${scan.meterName}`, 'info');
    }

    setValue(scan.value.toString());
    setPendingScan(null);
    toast.showToast('Value applied!', 'success');
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
        <Show when={showForm()} fallback={
          <div class="card bg-base-100 shadow-2xl border border-base-content/5 p-12 rounded-3xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <div class="bg-primary/10 p-6 rounded-3xl w-24 h-24 flex items-center justify-center mx-auto text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
            </div>
            <div>
              <h2 class="text-3xl font-black tracking-tighter">New Reading</h2>
              <p class="text-base-content/60 font-bold mt-2">How would you like to record your usage?</p>

              <div class="flex flex-col gap-4 mt-10 items-center">
                <div class="relative w-full max-w-xs text-center">
                  <input 
                    type="file" 
                    accept="image/*" 
                    capture 
                    class="hidden" 
                    id="photo-input-start" 
                    onChange={handleScan} 
                    disabled={!auth.user()?.googleApiKey}
                  />
                  <label 
                    for="photo-input-start" 
                    class="btn btn-primary btn-lg rounded-2xl w-full gap-3 shadow-xl shadow-primary/20 h-20 text-xl font-black"
                    classList={{ 'btn-disabled': !auth.user()?.googleApiKey }}
                  >
                    <Show when={isScanning()} fallback={
                      <><svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg> Scan Photo</>
                    }>
                      <span class="loading loading-spinner loading-md"></span>
                    </Show>
                  </label>
                  <Show when={!auth.user()?.googleApiKey}>
                    <p class="text-[10px] font-black uppercase text-warning mt-3 tracking-widest opacity-80 animate-in fade-in slide-in-from-top-1">
                      ⚠️ AI Scanning requires a Google API Key
                    </p>
                  </Show>
                </div>
                <div class="divider text-[10px] font-black opacity-20 uppercase tracking-widest">or</div>
                <button 
                  onClick={() => {
                    if (meters() && meters()!.length > 0) {
                      setShowForm(true);
                    } else {
                      navigate('/meters/add');
                    }
                  }} 
                  class="btn btn-ghost btn-lg rounded-2xl opacity-60 hover:opacity-100 font-black tracking-tight"
                >
                  {meters() && meters()!.length > 0 ? 'Enter Manually' : 'Register First Meter'}
                </button>
              </div>
            </div>
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
                    onChange={(e) => {
                      if (e.currentTarget.value === 'NEW_METER') {
                        navigate('/meters/add');
                      } else {
                        setSelectedMeterId(e.currentTarget.value);
                      }
                    }}
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
                    <option value="NEW_METER" class="text-primary font-bold">+ Register New Meter...</option>
                  </select>
                </div>

                <Show when={selectedMeter()}>
                  {(meter) => (
                    <div class="form-control w-full flex flex-col gap-2 animate-in fade-in slide-in-from-top-2">
                      <div class="flex justify-between items-end px-1">
                        <label>
                          <span class="label-text font-black uppercase text-xs tracking-widest opacity-60">Reading Value ({meter().unit})</span>
                        </label>
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
                          <input 
                            type="file" 
                            accept="image/*" 
                            capture 
                            class="hidden" 
                            id="photo-input" 
                            onChange={handleScan} 
                            disabled={!auth.user()?.googleApiKey}
                          />
                          <label 
                            for="photo-input" 
                            class="btn btn-primary h-20 w-20 rounded-2xl flex flex-col gap-1 items-center justify-center p-0 shadow-lg shadow-primary/20" 
                            classList={{ 'btn-disabled': !auth.user()?.googleApiKey }}
                            title={auth.user()?.googleApiKey ? "Take a photo of the meter" : "Google API Key required for scanning"}
                          >
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

                      <Show when={!auth.user()?.googleApiKey}>
                        <p class="text-[10px] font-black uppercase text-warning mt-1 text-right tracking-widest opacity-80 animate-in fade-in slide-in-from-top-1 px-1">
                          ⚠️ AI Scanning requires a Google API Key
                        </p>
                      </Show>

                      <Show when={pendingScan()}>
                        <div class="mt-4 p-6 rounded-2xl bg-warning/10 border-2 border-warning/20 animate-in zoom-in-95 duration-300">
                          <div class="flex items-start gap-4">
                            <div class="bg-warning p-2 rounded-xl text-warning-content shadow-lg shadow-warning/20 shrink-0">
                              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            </div>
                            <div class="flex-1">
                              <h3 class="font-black uppercase text-xs tracking-widest opacity-80 mb-1">Meter Conflict Detected</h3>
                              <p class="text-sm font-bold opacity-70 mb-4 leading-relaxed">The photo matches <span class="text-warning-content bg-warning/20 px-1 rounded">{pendingScan()?.meterName}</span>, but you have another meter selected. What would you like to do?</p>
                              
                              <div class="flex flex-col gap-2">
                                <button type="button" onClick={() => resolveMismatch(true)} class="btn btn-warning btn-sm rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-warning/20">
                                  Switch to detected meter
                                </button>
                                <button type="button" onClick={() => resolveMismatch(false)} class="btn btn-ghost btn-sm rounded-xl font-black uppercase text-[10px] tracking-widest opacity-60">
                                  Keep manual selection
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Show>

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