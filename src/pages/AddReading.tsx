import { Component, createSignal, createResource, Show, createEffect, For } from 'solid-js';
import { useNavigate, useParams } from '@solidjs/router';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Icon from '../components/Icon';

interface Meter { _id: string; name: string; meterNumber: string; unit: string; }
interface ScanResult { value: number; meterId: string; meterName: string; type: string; unit: string; }

const fetchMeters = async () => (await fetch('/api/meters')).json();

const EntrySelection: Component<{ isScanning: boolean; googleApiKey?: string; hasMeters: boolean; onScan: (e: Event) => void; onEnterManually: () => void; onAddMeter: () => void; }> = (props) => (
  <div class="card bg-base-100 shadow-2xl border border-base-content/5 p-12 rounded-3xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
    <div class="bg-primary/10 p-6 rounded-3xl w-24 h-24 flex items-center justify-center mx-auto text-primary"><Icon name="add" class="h-12 w-12" /></div>
    <div>
      <h2 class="text-3xl font-black tracking-tighter">New Reading</h2>
      <p class="text-base-content/60 font-bold mt-2">How would you like to record your usage?</p>
      <div class="flex flex-col gap-4 mt-10 items-center">
        <div class="w-full max-w-xs text-center flex flex-col gap-3">
          <div class="flex gap-3"><div class="flex-1"><input type="file" accept="image/*" capture="environment" class="hidden" id="photo-input-start" onChange={props.onScan} disabled={!props.googleApiKey} />
              <label for="photo-input-start" class="btn btn-primary btn-lg rounded-2xl w-full gap-3 shadow-xl shadow-primary/20 h-20 text-xl font-black" classList={{ 'btn-disabled': !props.googleApiKey }}>
                <Show when={props.isScanning} fallback={<><Icon name="camera" class="h-8 w-8" /> Scan Photo</>}><span class="loading loading-spinner loading-md"></span></Show>
              </label></div>
            <div class="md:hidden"><input type="file" accept="image/*" class="hidden" id="photo-upload-start" onChange={props.onScan} disabled={!props.googleApiKey} />
              <label for="photo-upload-start" class="btn btn-secondary btn-lg rounded-2xl h-20 w-20 p-0 shadow-xl shadow-secondary/10" classList={{ 'btn-disabled': !props.googleApiKey }} title="Upload from storage"><Icon name="image" class="h-8 w-8" /></label></div></div>
          {!props.googleApiKey && <p class="text-[10px] font-black uppercase text-warning mt-1 tracking-widest opacity-80 animate-in fade-in slide-in-from-top-1">⚠️ AI Scanning requires a Google API Key</p>}
        </div>
        <div class="divider text-[10px] font-black opacity-20 uppercase tracking-widest">or</div>
        <button onClick={props.hasMeters ? props.onEnterManually : props.onAddMeter} class="btn btn-ghost btn-lg rounded-2xl opacity-60 hover:opacity-100 font-black tracking-tight">{props.hasMeters ? 'Enter Manually' : 'Register First Meter'}</button>
      </div>
    </div>
  </div>
);

const ReadingValueInput: Component<{ unit: string; value: string; onInput: (v: string) => void; }> = (props) => (
  <div class="relative flex-1 group"><input type="number" step="0.01" placeholder="0.00" class="input input-bordered w-full h-20 rounded-2xl bg-base-200/50 border-none font-black text-4xl focus:ring-4 focus:ring-primary/20 text-center transition-all" value={props.value} onInput={(e) => props.onInput(e.currentTarget.value)} required autofocus />
    <div class="absolute inset-y-0 right-6 flex items-center pointer-events-none"><span class="text-xl font-black opacity-20 uppercase">{props.unit}</span></div></div>
);

const ReadingPhotoActions: Component<{ googleApiKey?: string; isScanning: boolean; onScan: (e: Event) => void; }> = (props) => (
  <div class="flex gap-2"><div class="relative"><input type="file" accept="image/*" capture="environment" class="hidden" id="photo-input" onChange={props.onScan} disabled={!props.googleApiKey} />
      <label for="photo-input" class="btn btn-primary h-20 w-20 rounded-2xl flex flex-col gap-1 items-center justify-center p-0 shadow-lg shadow-primary/20" classList={{ 'btn-disabled': !props.googleApiKey }} title={props.googleApiKey ? "Take a photo" : "API Key required"}>
        <Show when={props.isScanning} fallback={<><Icon name="camera" class="h-8 w-8" /><span class="text-[10px] font-black uppercase tracking-tighter">Scan</span></>}><span class="loading loading-spinner loading-md"></span></Show>
      </label></div>
    <div class="md:hidden"><input type="file" accept="image/*" class="hidden" id="photo-upload" onChange={props.onScan} disabled={!props.googleApiKey} />
      <label for="photo-upload" class="btn btn-secondary h-20 w-20 rounded-2xl flex flex-col gap-1 items-center justify-center p-0 shadow-lg shadow-secondary/10" classList={{ 'btn-disabled': !props.googleApiKey }} title="Upload from storage"><Icon name="image" class="h-8 w-8" /><span class="text-[10px] font-black uppercase tracking-tighter">Album</span></label></div></div>
);

const MeterMismatchBanner: Component<{ detectedName: string; onResolve: (useDetected: boolean) => void; }> = (props) => (
  <div class="mt-4 p-6 rounded-2xl bg-warning/10 border-2 border-warning/20 animate-in zoom-in-95 duration-300">
    <div class="flex items-start gap-4"><div class="bg-warning p-2 rounded-xl text-warning-content shadow-lg shadow-warning/20 shrink-0"><Icon name="warning" class="h-6 w-6" /></div>
      <div class="flex-1"><h3 class="font-black uppercase text-xs tracking-widest opacity-80 mb-1">Meter Conflict</h3>
        <p class="text-sm font-bold opacity-70 mb-4">Matches <span class="text-warning-content bg-warning/20 px-1 rounded">{props.detectedName}</span>. Switch?</p>
        <div class="flex flex-col gap-2"><button type="button" onClick={() => props.onResolve(true)} class="btn btn-warning btn-sm rounded-xl font-black uppercase text-[10px] shadow-lg">Switch to detected</button>
          <button type="button" onClick={() => props.onResolve(false)} class="btn btn-ghost btn-sm rounded-xl font-black uppercase text-[10px] opacity-60">Keep manual</button></div></div></div></div>
);

const ReadingForm: Component<{ meters: Meter[]; selectedMeterId: string; setSelectedMeterId: (id: string) => void; value: string; setValue: (v: string) => void; date: string; setDate: (v: string) => void; isScanning: boolean; scanPreview: string | null; setScanPreview: (v: string | null) => void; pendingScan: ScanResult | null; googleApiKey?: string; onScan: (e: Event) => void; onResolveMismatch: (useDetected: boolean) => void; onSubmit: (e: Event) => void; onCancel: () => void; onAddMeter: () => void; }> = (props) => {
  const selectedMeter = () => props.meters.find(m => m._id === props.selectedMeterId);
  return (<div class="card bg-base-100 shadow-2xl border border-base-content/5 overflow-hidden"><div class="card-body p-8 md:p-12"><form onSubmit={props.onSubmit} class="space-y-8">
    <div class="form-control w-full flex flex-col gap-2"><label class="px-1"><span class="label-text font-black uppercase text-xs tracking-widest opacity-60">Select Meter</span></label>
      <select class="select select-bordered h-14 rounded-2xl bg-base-200/50 border-none font-bold text-lg focus:ring-2 focus:ring-primary px-6" value={props.selectedMeterId} onChange={(e) => e.currentTarget.value === 'NEW_METER' ? props.onAddMeter() : props.setSelectedMeterId(e.currentTarget.value)} required>
        <option value="" disabled>Choose a meter...</option><For each={props.meters}>{(meter) => <option value={meter._id}>{meter.name} ({meter.meterNumber})</option>}</For>
        <option value="NEW_METER" class="text-primary font-bold">+ Register New Meter...</option></select></div>
    <Show when={selectedMeter()}>{(meter) => (<div class="form-control w-full flex flex-col gap-2 animate-in fade-in slide-in-from-top-2"><div class="flex justify-between items-end px-1"><label><span class="label-text font-black uppercase text-xs tracking-widest opacity-60">Value ({meter().unit})</span></label></div>
        <div class="flex gap-3 items-start"><ReadingValueInput unit={meter().unit} value={props.value} onInput={props.setValue} />
          {!props.scanPreview && <ReadingPhotoActions googleApiKey={props.googleApiKey} isScanning={props.isScanning} onScan={props.onScan} />}</div>
        {!props.googleApiKey && <p class="text-[10px] font-black uppercase text-warning mt-1 text-right tracking-widest opacity-80 px-1">⚠️ AI Scan requires Key</p>}
        {props.pendingScan && <MeterMismatchBanner detectedName={props.pendingScan!.meterName} onResolve={props.onResolveMismatch} />}
        {props.scanPreview && <div class="mt-2 flex justify-center"><div class="relative"><img src={props.scanPreview!} class="h-24 w-auto rounded-lg border-2 border-primary/20 shadow-md" /><button type="button" class="btn btn-circle btn-xs absolute -top-2 -right-2 btn-error" onClick={() => props.setScanPreview(null)}>✕</button></div></div>}</div>)}</Show>
    <div class="form-control w-full flex flex-col gap-2"><label class="px-1"><span class="label-text font-black uppercase text-xs tracking-widest opacity-60">Date</span></label>
      <input type="date" class="input input-bordered h-14 rounded-2xl bg-base-200/50 border-none font-bold text-lg focus:ring-2 focus:ring-primary px-6" value={props.date} onInput={(e) => props.setDate(e.currentTarget.value)} required /></div>
    <div class="card-actions justify-end pt-6"><button type="button" onClick={props.onCancel} class="btn btn-ghost btn-lg px-10 font-bold rounded-2xl">Cancel</button>
      <button type="submit" class="btn btn-primary btn-lg px-12 font-black rounded-2xl shadow-xl shadow-primary/20">Save Reading</button></div></form></div></div>);
};

const ReadingPageHeader: Component = () => (<div class="mb-10 text-center md:text-left"><h1 class="text-4xl font-black tracking-tighter">Add Reading</h1><p class="text-base-content/60 font-bold text-lg">Record consumption.</p></div>);

const fileToBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = (e) => resolve(e.target?.result as string); reader.onerror = () => reject(new Error('Read failed')); reader.readAsDataURL(file); });

const handleReadingScan = async (p: { 
  file: File; 
  setScanPreview: (v: string | null) => void; 
  setIsScanning: (v: boolean) => void; 
  setPendingScan: (v: ScanResult | null) => void; 
  onSuccess: (res: ScanResult) => void; 
  onError: (msg: string) => void; 
}) => {
  const { file, setScanPreview, setIsScanning, setPendingScan, onSuccess, onError } = p;
  const reader = new FileReader(); reader.onload = (e) => setScanPreview(e.target?.result as string); reader.readAsDataURL(file);
  setIsScanning(true); setPendingScan(null);
  try {
    const base64 = await fileToBase64(file);
    const res = await fetch('/api/ocr/scan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image: base64 }) });
    if (!res.ok) { throw new Error((await res.json()).error || 'OCR failed'); }
    onSuccess(await res.json());
  } catch (err) { onError(err instanceof Error ? err.message : 'OCR failed'); } finally { setIsScanning(false); }
};

const useAddReadingData = (paramsId: string | undefined, setShowForm: (v: boolean) => void) => {
  const [selectedMeterId, setSelectedMeterId] = createSignal(paramsId || localStorage.getItem('lastMeterId') || '');
  const [meters, { refetch }] = createResource<Meter[]>(fetchMeters);
  createEffect(() => { if (paramsId) { setSelectedMeterId(paramsId); setShowForm(true); } });
  createEffect(() => {
    const list = meters(); if (!list?.length) { return; }
    const curr = selectedMeterId(); if (curr && list.find(m => m._id === curr)) { return; }
    if (list.length === 1) { return setSelectedMeterId(list[0]._id); }
    const lastId = localStorage.getItem('lastMeterId');
    if (lastId && list.find(m => m._id === lastId)) { setSelectedMeterId(lastId); } else { setSelectedMeterId(''); }
  });
  return { selectedMeterId, setSelectedMeterId, meters, refetch };
};

const AddReading: Component = () => {
  const params = useParams(); const navigate = useNavigate(); const toast = useToast(); const auth = useAuth();
  const [showForm, setShowForm] = createSignal(!!params.id); const [value, setValue] = createSignal(''); const [date, setDate] = createSignal(new Date().toISOString().split('T')[0]);
  const [isScanning, setIsScanning] = createSignal(false); const [scanPreview, setScanPreview] = createSignal<string | null>(null); const [pendingScan, setPendingScan] = createSignal<ScanResult | null>(null);
  const { selectedMeterId, setSelectedMeterId, meters, refetch } = useAddReadingData(params.id, setShowForm);
  const selectedMeter = () => meters()?.find(m => m._id === selectedMeterId());
  const processScanResult = (res: ScanResult) => {
    const meter = selectedMeter(); setShowForm(true);
    if (meter && res.meterId && res.meterId !== meter._id) { setPendingScan(res); return toast.showToast('Meter mismatch', 'warning'); }
    setValue(res.value.toString()); if (res.meterId) { setSelectedMeterId(res.meterId); refetch(); toast.showToast(`Matched: ${res.meterName}`, 'info'); }
    toast.showToast('Detected!', 'success');
  };
  const handleScan = (e: Event) => { const file = (e.target as HTMLInputElement).files?.[0]; if (file) { handleReadingScan({ file, setScanPreview, setIsScanning, setPendingScan, onSuccess: processScanResult, onError: (m: string) => toast.showToast(m, 'error') }); } };
  const resolveMismatch = (useDetected: boolean) => {
    const scan = pendingScan(); if (!scan) { return; }
    if (useDetected) { setSelectedMeterId(scan.meterId); refetch(); toast.showToast(`Switched: ${scan.meterName}`, 'info'); }
    setValue(scan.value.toString()); setPendingScan(null); toast.showToast('Applied!', 'success');
  };
  const handleSubmit = async (e: Event) => {
    e.preventDefault(); const mId = selectedMeterId(); if (!mId) { return toast.showToast('Select meter', 'warning'); }
    try {
      const res = await fetch('/api/readings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ meterId: mId, value: Number(value()), date: new Date(date()) }) });
      if (res.ok) { localStorage.setItem('lastMeterId', mId); toast.showToast('Saved!', 'success'); navigate(`/meters/${mId}/readings`); }
      else { toast.showToast('Failed', 'error'); }
    } catch (_err) { toast.showToast('Error', 'error'); }
  };
  return (<div class="p-6 md:p-10 lg:p-12 max-w-2xl mx-auto flex-1 flex flex-col justify-center"><Show when={!meters.loading} fallback={<div class="flex justify-center py-20"><span class="loading loading-spinner loading-lg text-primary"></span></div>}>
    <Show when={showForm()} fallback={<EntrySelection isScanning={isScanning()} googleApiKey={auth.user()?.googleApiKey} hasMeters={!!meters()?.length} onScan={handleScan} onEnterManually={() => setShowForm(true)} onAddMeter={() => navigate('/meters/add')} />}>
      <ReadingPageHeader /><ReadingForm meters={meters() || []} selectedMeterId={selectedMeterId()} setSelectedMeterId={setSelectedMeterId} value={value()} setValue={setValue} date={date()} setDate={setDate} isScanning={isScanning()} scanPreview={scanPreview()} setScanPreview={setScanPreview} pendingScan={pendingScan()} googleApiKey={auth.user()?.googleApiKey} onScan={handleScan} onResolveMismatch={resolveMismatch} onSubmit={handleSubmit} onCancel={() => navigate('/dashboard')} onAddMeter={() => navigate('/meters/add')} />
    </Show></Show></div>);
};

export default AddReading;
