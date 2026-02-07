import { Component, Show, createSignal, For, createEffect } from 'solid-js';
import { Portal } from 'solid-js/web';
import { parseCsv } from '../lib/csvParser';
import { parseLocaleNumber } from '../lib/numberUtils';
import MeterForm from './MeterForm';
import EmptyState from './EmptyState';
import Icon from './Icon';

interface Meter { _id: string; name: string; }
interface ImportReading { meterId: string; date: Date; value: number; }
interface PreviewReading extends ImportReading { originalDate: string; originalValue: string; }
interface CsvImportModalProps { isOpen: boolean; onClose: () => void; onSave: (readings: ImportReading[]) => Promise<void>; meters: Meter[]; onMeterCreated?: (meter: Meter) => void; }
type Step = 'upload' | 'mapping' | 'preview' | 'importing' | 'new-meter';

const StepUpload: Component<{ onPasteClick: () => void, onManualPaste: (e: { target: HTMLTextAreaElement }) => void }> = (props) => (
  <div class="flex flex-col gap-6">
    <button class="btn btn-outline btn-lg border-2 border-dashed h-32 flex flex-col gap-2 rounded-2xl transition-all" onClick={props.onPasteClick}>
      <span class="text-lg font-black">Paste from Clipboard</span>
    </button>
    <div class="divider opacity-20 text-xs font-black uppercase tracking-[0.2em]">OR</div>
    <div class="form-control w-full flex flex-col gap-2">
      <label class="px-1"><span class="label-text font-black uppercase text-xs tracking-widest opacity-60">Manual Paste</span></label>
      <textarea class="textarea textarea-bordered w-full h-40 font-mono text-sm" placeholder="01.01.2022	2.852..." onInput={props.onManualPaste}></textarea>
    </div>
  </div>
);

const StepMapping: Component<{ 
  meters: Meter[], targetMeterId: string, setTargetMeterId: (v: string) => void,
  headers: string[], dateColumn: string, setDateColumn: (v: string) => void,
  valueColumn: string, setValueColumn: (v: string) => void,
  sampleRow?: Record<string, string>, onCreateNewMeter?: () => void
}> = (props) => (
  <div class="space-y-6">
    <div class="form-control w-full flex flex-col gap-2">
      <label class="px-1"><span class="label-text font-black uppercase text-xs tracking-widest opacity-60">Target Meter</span></label>
      <select class="select select-bordered h-12 rounded-xl" value={props.targetMeterId} onChange={(e) => { if (e.currentTarget.value === 'NEW_METER') { props.onCreateNewMeter?.(); } else { props.setTargetMeterId(e.currentTarget.value); } }}>
        <option value="" disabled>Choose Meter...</option><For each={props.meters}>{(meter) => <option value={meter._id}>{meter.name}</option>}</For><option value="NEW_METER" class="text-primary font-bold">+ Register New Meter...</option>
      </select>
    </div>
    <div class="grid grid-cols-2 gap-4">
      <div class="form-control flex flex-col gap-2"><label class="px-1"><span class="label-text font-black uppercase text-xs tracking-widest opacity-60">Date Column</span></label>
        <select class="select select-bordered h-12 rounded-xl" value={props.dateColumn} onChange={(e) => props.setDateColumn(e.currentTarget.value)}><For each={props.headers}>{(header) => <option value={header}>{header}</option>}</For></select></div>
      <div class="form-control flex flex-col gap-2"><label class="px-1"><span class="label-text font-black uppercase text-xs tracking-widest opacity-60">Value Column</span></label>
        <select class="select select-bordered h-12 rounded-xl" value={props.valueColumn} onChange={(e) => props.setValueColumn(e.currentTarget.value)}><For each={props.headers}>{(header) => <option value={header}>{header}</option>}</For></select></div>
    </div>
    <div class="bg-base-200/30 border p-4 rounded-2xl overflow-x-auto"><table class="table table-xs"><thead><tr><For each={props.headers}>{(h) => <th class="font-bold text-xs">{h}</th>}</For></tr></thead>
      <tbody><tr><For each={props.headers}>{(h) => <td class="text-xs">{props.sampleRow?.[h]}</td>}</For></tr></tbody></table></div>
  </div>
);

const ModalFooter: Component<{ step: Step; onClose: () => void; onBack: () => void; onNext: () => void; onImport: () => void; onCreateMeter: () => void; isCreatingMeter: boolean; canNext: boolean; }> = (props) => (
  <div class="modal-action">
    <Show when={props.step === 'upload'}><button class="btn" onClick={props.onClose}>Cancel</button></Show>
    <Show when={props.step === 'mapping'}><button class="btn" onClick={props.onBack}>Back</button><button class="btn btn-primary" onClick={props.onNext}>Next: Preview</button></Show>
    <Show when={props.step === 'new-meter'}><button class="btn" onClick={props.onBack} disabled={props.isCreatingMeter}>Back</button>
      <button class="btn btn-primary" onClick={props.onCreateMeter} disabled={props.isCreatingMeter}><Show when={props.isCreatingMeter} fallback="Create Meter"><span class="loading loading-spinner loading-sm"></span></Show></button></Show>
    <Show when={props.step === 'preview'}><button class="btn" onClick={props.onBack}>Back</button><button class="btn btn-primary" onClick={props.onImport}>Import Data</button></Show>
  </div>
);

const CsvImportModal: Component<CsvImportModalProps> = (props) => {
  const [step, setStep] = createSignal<Step>('upload'); const [csvData, setCsvData] = createSignal<Record<string, string>[]>([]); const [headers, setHeaders] = createSignal<string[]>([]);
  const [targetMeterId, setTargetMeterId] = createSignal(''); const [dateColumn, setDateColumn] = createSignal(''); const [valueColumn, setValueColumn] = createSignal('');
  const [error, setError] = createSignal<string | null>(null); const [newMeterName, setNewMeterName] = createSignal(''); const [newMeterNumber, setNewMeterNumber] = createSignal('');
  const [newMeterType, setNewMeterType] = createSignal('power'); const [newMeterUnit, setNewMeterUnit] = createSignal('kWh'); const [isCreatingMeter, setIsCreatingMeter] = createSignal(false);
  const reset = () => { setStep('upload'); setCsvData([]); setHeaders([]); setTargetMeterId(props.meters[0]?._id || ''); setDateColumn(''); setValueColumn(''); setError(null); setNewMeterName(''); setNewMeterNumber(''); setNewMeterType('power'); setNewMeterUnit('kWh'); setIsCreatingMeter(false); };
  const handleCreateNewMeter = async () => {
    if (!newMeterName() || !newMeterNumber()) { return setError('Enter name and number'); }
    setIsCreatingMeter(true);
    try {
      const res = await fetch('/api/meters', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newMeterName(), meterNumber: newMeterNumber(), type: newMeterType(), unit: newMeterUnit() }) });
      if (!res.ok) { return setError((await res.json()).error || 'Failed'); }
      const m = await res.json(); setTargetMeterId(m._id); props.onMeterCreated?.(m); setStep('mapping'); setError(null);
    } catch (_e) { setError('Error creating meter'); } finally { setIsCreatingMeter(false); }
  };
  createEffect(() => { if (props.isOpen) { reset(); } });
  const handleTextProcess = (t: string) => {
    try {
      const parsed = parseCsv(t); if (!parsed.length) { return setError('No data found'); }
      setCsvData(parsed); setHeaders(Object.keys(parsed[0])); setDateColumn(Object.keys(parsed[0]).find(h => /date|datum/i.test(h)) || Object.keys(parsed[0])[0]);
      setValueColumn(Object.keys(parsed[0]).find(h => /value|wert/i.test(h)) || (Object.keys(parsed[0]).length > 1 ? Object.keys(parsed[0])[1] : ''));
      setStep('mapping'); setError(null);
    } catch (_e) { setError('Failed to parse content'); }
  };
  const getPreviewData = (): PreviewReading[] => {
    const mId = targetMeterId(); const dCol = dateColumn(); const vCol = valueColumn();
    if (!mId || !dCol || !vCol) { return []; }
    return csvData().reduce((acc: PreviewReading[], row) => {
      const d = new Date(row[dCol]); const v = parseLocaleNumber(row[vCol]);
      if (!isNaN(d.getTime()) && !isNaN(v)) { acc.push({ meterId: mId, date: d, value: v, originalDate: row[dCol], originalValue: row[vCol] }); }
      return acc;
    }, []);
  };
  const handleImport = async () => { setStep('importing'); try { await props.onSave(getPreviewData()); props.onClose(); } catch (_e) { setError('Import failed'); setStep('preview'); } };
  return (
    <Show when={props.isOpen}><Portal><div class="modal modal-open"><div class="modal-box w-11/12 max-w-2xl"><h3 class="font-bold text-lg">Import Data</h3><div class="py-4">
      <Show when={props.meters.length === 0 && step() === 'upload'}><EmptyState title="No meters" description="Create one first." compact={true} onAction={() => setStep('new-meter')} actionLabel="Create" icon={<Icon name="warning" class="h-10 w-10" />} /></Show>
      {error() && <div class="alert alert-error mb-4">{error()}</div>}
      <Show when={step() === 'upload'}><StepUpload onPasteClick={async () => handleTextProcess(await navigator.clipboard.readText())} onManualPaste={e => handleTextProcess(e.target.value)} /></Show>
      <Show when={step() === 'mapping'}><StepMapping meters={props.meters} targetMeterId={targetMeterId()} setTargetMeterId={setTargetMeterId} headers={headers()} dateColumn={dateColumn()} setDateColumn={setDateColumn} valueColumn={valueColumn()} setValueColumn={setValueColumn} sampleRow={csvData()[0]} onCreateNewMeter={() => setStep('new-meter')} /></Show>
      <Show when={step() === 'new-meter'}><MeterForm name={newMeterName()} setName={setNewMeterName} meterNumber={newMeterNumber()} setMeterNumber={setNewMeterNumber} type={newMeterType()} setType={setNewMeterType} unit={newMeterUnit()} setUnit={setNewMeterUnit} isLoading={isCreatingMeter()} compact={true} /></Show>
      <Show when={step() === 'preview'}><p class="mb-4 font-black uppercase text-xs opacity-60">Preview ({getPreviewData().length})</p><div class="overflow-x-auto max-h-96 border rounded-2xl"><table class="table table-xs"><thead><tr><th>Date</th><th>Value</th><th>Original</th></tr></thead>
        <tbody><For each={getPreviewData()}>{r => <tr><td>{r.date.toLocaleDateString()}</td><td class="font-bold">{r.value}</td><td class="opacity-60">{r.originalDate} | {r.originalValue}</td></tr>}</For></tbody></table></div></Show>
      <Show when={step() === 'importing'}><div class="flex justify-center p-10"><span class="loading loading-spinner loading-lg"></span></div></Show>
    </div><ModalFooter step={step()} onClose={props.onClose} onBack={() => { if (step() === 'mapping') { setStep('upload'); } else if (step() === 'new-meter') { setStep(props.meters.length > 0 ? 'mapping' : 'upload'); } else if (step() === 'preview') { setStep('mapping'); } }} onNext={() => (targetMeterId() && dateColumn() && valueColumn()) ? setStep('preview') : setError('Map all fields.')} onImport={handleImport} onCreateMeter={handleCreateNewMeter} isCreatingMeter={isCreatingMeter()} canNext={!!(targetMeterId() && dateColumn() && valueColumn())} /></div></div></Portal></Show>
  );
};

export default CsvImportModal;
