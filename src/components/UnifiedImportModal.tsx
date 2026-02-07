import { Component, Show, createSignal, For, createEffect, on, untrack } from 'solid-js';
import { Portal } from 'solid-js/web';
import { parseCsv } from '../lib/csvParser';
import { isUnifiedExportFormat, parseUnifiedFormat } from '../lib/jsonParser';
import { detectFileType } from '../lib/fileTypeDetector';
import { parseLocaleNumber } from '../lib/numberUtils';
import MeterForm from './MeterForm';
import EmptyState from './EmptyState';
import Icon from './Icon';

interface Meter {
  _id: string;
  name: string;
  meterNumber?: string;
  type?: string;
  unit?: string;
}

interface ImportReading {
  meterId: string;
  date: Date;
  value: number;
}

interface PreviewReading extends ImportReading {
  originalDate: string;
  originalValue: string;
}

interface ImportData {
  exportDate?: string;
  version?: string;
  data?: {
    meters?: Array<{ id: string; name: string; meterNumber: string; type: string; unit: string }>;
    readings?: Array<{ meterId: string; date: string; value: number }>;
    contracts?: Array<{ meterId: string; providerName: string; startDate: string }>;
  };
}

interface UnifiedImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ImportData | ImportReading[]) => Promise<void>;
  meters: Meter[];
  onMeterCreated?: (meter: Meter) => void;
}

const StepUpload: Component<{ onFileSelected: (file: File) => void, onPasteClick: () => void }> = (props) => {
  let fileInputRef: HTMLInputElement | undefined;

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).classList.add('border-primary', 'bg-primary/5');
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).classList.remove('border-primary', 'bg-primary/5');
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).classList.remove('border-primary', 'bg-primary/5');
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      props.onFileSelected(file);
    }
  };

  return (
    <div class="flex flex-col gap-4">
      <button 
        class="btn btn-outline btn-lg border-2 border-dashed h-32 flex flex-col gap-2 hover:bg-base-200/30 hover:border-primary/30 normal-case w-full rounded-2xl transition-all"
        onClick={props.onPasteClick}
      >
        <Icon name="history" class="w-6 h-6 opacity-60" />
        <span class="text-lg font-black">Paste from Clipboard</span>
        <span class="text-[10px] opacity-60 font-bold uppercase tracking-widest">Click to auto-fill</span>
      </button>
      <div class="divider opacity-20 text-xs font-black uppercase tracking-[0.2em]">OR</div>
      <div
        class="border-2 border-dashed border-base-content/20 h-32 flex flex-col items-center justify-center gap-2 rounded-2xl cursor-pointer transition-all hover:border-primary/30 hover:bg-base-200/30"
        onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
        onClick={() => fileInputRef?.click()}
      >
        <Icon name="import" class="w-6 h-6 opacity-60" />
        <span class="font-bold text-sm">Drop file here or click</span>
        <span class="text-xs opacity-60">JSON or CSV files supported</span>
        <input ref={fileInputRef} type="file" accept=".json,.csv" class="hidden" onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            props.onFileSelected(file);
          }
        }} />
      </div>
    </div>
  );
};

const StepMapping: Component<{
  meters: Meter[]; targetMeterId: string; setTargetMeterId: (v: string) => void;
  headers: string[]; dateColumn: string; setDateColumn: (v: string) => void;
  valueColumn: string; setValueColumn: (v: string) => void;
  onCreateNewMeter?: () => void;
}> = (props) => (
  <div class="space-y-6">
    <div class="form-control w-full flex flex-col gap-2">
      <label class="px-1"><span class="label-text font-black uppercase text-xs tracking-widest opacity-60">1. Select Target Meter</span></label>
      <select 
        class="select select-bordered h-12 rounded-xl bg-base-200/50 border-none font-bold focus:ring-2 focus:ring-primary px-4"
        value={props.targetMeterId} 
        onChange={(e) => {
          if (e.currentTarget.value === 'NEW_METER') {
            props.onCreateNewMeter?.();
          } else {
            props.setTargetMeterId(e.currentTarget.value);
          }
        }}
      >
        <option value="" disabled>Choose Meter...</option>
        <For each={props.meters}>{(meter) => <option value={meter._id}>{meter.name}</option>}</For>
        <option value="NEW_METER" class="text-primary font-bold">+ Register New Meter...</option>
      </select>
    </div>
    <div class="grid grid-cols-2 gap-4">
      <div class="form-control flex flex-col gap-2">
        <label class="px-1"><span class="label-text font-black uppercase text-xs tracking-widest opacity-60">2. Date Column</span></label>
        <select class="select select-bordered h-12 rounded-xl bg-base-200/50 border-none font-bold focus:ring-2 focus:ring-primary px-4" value={props.dateColumn} onChange={(e) => props.setDateColumn(e.currentTarget.value)}>
          <For each={props.headers}>{(header) => <option value={header}>{header}</option>}</For>
        </select>
      </div>
      <div class="form-control flex flex-col gap-2">
        <label class="px-1"><span class="label-text font-black uppercase text-xs tracking-widest opacity-60">3. Value Column</span></label>
        <select class="select select-bordered h-12 rounded-xl bg-base-200/50 border-none font-bold focus:ring-2 focus:ring-primary px-4" value={props.valueColumn} onChange={(e) => props.setValueColumn(e.currentTarget.value)}>
          <For each={props.headers}>{(header) => <option value={header}>{header}</option>}</For>
        </select>
      </div>
    </div>
  </div>
);

const StepPreview: Component<{ data: PreviewReading[]; backupInfo?: ImportData; existingMeters: Meter[]; }> = (props) => {
  const getMeterName = (id: string) => props.backupInfo?.data?.meters?.find(m => m.id === id)?.name || props.existingMeters.find(m => m._id === id)?.name || 'Unknown Meter';
  const willCreateMeter = (m: { meterNumber: string }) => !props.existingMeters.find(em => em.meterNumber === m.meterNumber);

  return (
    <div class="space-y-6">
      <Show when={props.backupInfo?.data?.meters?.length}>
         <div class="space-y-4">
           <div>
             <p class="text-[10px] font-black uppercase tracking-widest opacity-50 mb-2">Meters to Sync</p>
             <div class="grid grid-cols-1 gap-2">
               <For each={props.backupInfo!.data!.meters!}>{(m) => (
                 <div class="flex items-center justify-between p-3 bg-base-200/50 rounded-xl border border-base-content/5">
                   <div class="flex flex-col"><span class="font-bold text-sm">{m.name}</span><span class="text-[10px] opacity-50">{m.meterNumber} • {m.type} ({m.unit})</span></div>
                   <span class={`badge badge-sm font-bold ${willCreateMeter(m) ? 'badge-primary' : 'badge-ghost opacity-50'}`}>{willCreateMeter(m) ? 'NEW' : 'EXISTING'}</span>
                 </div>
               )}</For>
            </div>
          </div>
        </div>
      </Show>
      <div>
        <p class="text-[10px] font-black uppercase tracking-widest opacity-50 mb-2">{props.backupInfo ? 'Readings to Import' : 'Preview Readings'} ({props.data.length})</p>
        <div class="overflow-x-auto max-h-64 border border-base-content/10 rounded-2xl bg-base-200/20">
          <table class="table table-xs table-pin-rows">
            <thead><tr><th class="font-bold text-xs">Meter</th><th class="font-bold text-xs">Date</th><th class="font-bold text-xs text-right">Value</th></tr></thead>
            <tbody><For each={props.data}>{(row) => (
              <tr><td class="text-[10px] font-bold opacity-70 truncate max-w-[120px]">{getMeterName(row.meterId)}</td><td class="text-xs">{row.date.toLocaleDateString()}</td><td class="font-bold text-xs text-right">{row.value}</td></tr>
            )}</For></tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

type Step = 'upload' | 'mapping' | 'preview' | 'importing' | 'new-meter';
type FileFormat = 'csv' | 'json-nested' | 'json-flat';

interface ImportState {
  setStep: (v: Step) => void;
  setFileFormat: (v: FileFormat) => void;
  setCsvData: (v: Record<string, string>[]) => void;
  setJsonReadings: (v: Array<{ meterId: string; date: string; value: number }>) => void;
  setBackupData: (v: ImportData | null) => void;
  setHeaders: (v: string[]) => void;
  setTargetMeterId: (v: string) => void;
  setDateColumn: (v: string) => void;
  setValueColumn: (v: string) => void;
  setError: (v: string | null) => void;
  newMeterName: () => string;
  newMeterNumber: () => string;
  newMeterType: () => string;
  newMeterUnit: () => string;
  setIsCreatingMeter: (v: boolean) => void;
}

const handleUnifiedBackup = (opts: { jsonData: ImportData; state: ImportState }) => {
  const result = parseUnifiedFormat(opts.jsonData);
  opts.state.setBackupData(opts.jsonData);
  opts.state.setJsonReadings(result.readings.map(r => ({ meterId: r.meterId, date: r.date, value: r.value })));
  opts.state.setFileFormat('json-nested');
  opts.state.setStep('preview');
};

const handleJsonArrayImport = (opts: { jsonData: unknown[]; state: ImportState }) => {
  const firstItem = opts.jsonData[0] as Record<string, unknown>;
  const cols = Object.keys(firstItem);
  opts.state.setCsvData(opts.jsonData.map(row => {
    const newRow: Record<string, string> = {};
    Object.entries(row as Record<string, unknown>).forEach(([k, v]) => {
      newRow[k] = v === null || v === undefined ? '' : String(v);
    });
    return newRow;
  }));
  opts.state.setHeaders(cols);
  opts.state.setDateColumn(cols.find(h => /date|datum|time/i.test(h)) || cols[0]);
  opts.state.setValueColumn(cols.find(h => /value|wert|reading|strom|gas|wasser/i.test(h)) || (cols.length > 1 ? cols[1] : ''));
  opts.state.setFileFormat('csv');
  opts.state.setStep('mapping');
};

const ModalFooter: Component<{ step: Step; onClose: () => void; onBack: () => void; onNext: () => void; onImport: () => void; onCreateMeter: () => void; isCreatingMeter: boolean; hasBackup: boolean; }> = (props) => (
  <div class="modal-action">
    <Show when={props.step === 'upload'}><button class="btn" onClick={props.onClose}>Cancel</button></Show>
    <Show when={props.step === 'mapping'}><button class="btn" onClick={props.onBack}>Back</button><button class="btn btn-primary" onClick={props.onNext}>Next: Preview</button></Show>
    <Show when={props.step === 'new-meter'}><button class="btn" onClick={props.onBack} disabled={props.isCreatingMeter}>Back</button><button class="btn btn-primary" onClick={props.onCreateMeter} disabled={props.isCreatingMeter}>
      <Show when={props.isCreatingMeter} fallback="Create Meter"><span class="loading loading-spinner loading-sm"></span></Show>
    </button></Show>
    <Show when={props.step === 'preview'}><button class="btn" onClick={props.onBack}>Back</button><button class="btn btn-primary" onClick={props.onImport}>{props.hasBackup ? 'Restore Backup' : 'Import Data'}</button></Show>
  </div>
);

const UnifiedImportModal: Component<UnifiedImportModalProps> = (props) => {
  const [step, setStep] = createSignal<Step>('upload');
  const [fileFormat, setFileFormat] = createSignal<FileFormat>('csv');
  const [csvData, setCsvData] = createSignal<Record<string, string>[]>([]);
  const [jsonReadings, setJsonReadings] = createSignal<Array<{ meterId: string; date: string; value: number }>>([]);
  const [backupData, setBackupData] = createSignal<ImportData | null>(null);
  const [headers, setHeaders] = createSignal<string[]>([]);
  const [targetMeterId, setTargetMeterId] = createSignal<string>('');
  const [dateColumn, setDateColumn] = createSignal<string>('');
  const [valueColumn, setValueColumn] = createSignal<string>('');
  const [error, setError] = createSignal<string | null>(null);
  const [newMeterName, setNewMeterName] = createSignal<string>('');
  const [newMeterNumber, setNewMeterNumber] = createSignal<string>('');
  const [newMeterType, setNewMeterType] = createSignal<string>('power');
  const [newMeterUnit, setNewMeterUnit] = createSignal<string>('kWh');
  const [isCreatingMeter, setIsCreatingMeter] = createSignal(false);

  const state: ImportState = { setStep, setFileFormat, setCsvData, setJsonReadings, setBackupData, setHeaders, setTargetMeterId, setDateColumn, setValueColumn, setError, newMeterName, newMeterNumber, newMeterType, newMeterUnit, setIsCreatingMeter };

  const reset = () => {
    setStep('upload'); setFileFormat('csv'); setCsvData([]); setJsonReadings([]); setBackupData(null);
    setHeaders([]); setTargetMeterId(props.meters[0]?._id || ''); setDateColumn(''); setValueColumn('');
    setError(null); setNewMeterName(''); setNewMeterNumber(''); setNewMeterType('power');
    setNewMeterUnit('kWh'); setIsCreatingMeter(false);
  };

  const handleCreateNewMeter = async () => {
    const name = newMeterName(); const meterNumber = newMeterNumber();
    if (!name || !meterNumber) { return setError('Please enter meter name and number'); }
    setIsCreatingMeter(true);
    try {
      const res = await fetch('/api/meters', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, meterNumber, type: newMeterType(), unit: newMeterUnit() }) });
      if (!res.ok) { return setError((await res.json()).error || 'Failed to create meter'); }
      const newMeter = await res.json(); setTargetMeterId(newMeter._id); props.onMeterCreated?.(newMeter);
      setStep('mapping'); setError(null);
    } catch (_err) { setError('Failed to create meter'); } finally { setIsCreatingMeter(false); }
  };

  const processJsonFile = (content: string) => {
    try {
      const jsonData = JSON.parse(content);
      if (isUnifiedExportFormat(jsonData)) { return handleUnifiedBackup({ jsonData: jsonData as ImportData, state }); }
      if (Array.isArray(jsonData) && jsonData.length > 0) { return handleJsonArrayImport({ jsonData, state }); }
      throw new Error('Unsupported JSON structure.');
    } catch (err) { console.error('JSON error:', err); throw err; }
  };

  const handleFileSelected = async (file: File) => {
    try {
      setError(null); const content = await file.text();
      const detectedType = detectFileType(file.name, content);
      if (detectedType === 'json') { processJsonFile(content); } else {
        const parsed = parseCsv(content); if (parsed.length === 0) { return setError('No data found'); }
        setCsvData(parsed); setHeaders(Object.keys(parsed[0])); setDateColumn(Object.keys(parsed[0]).find(h => /date|datum|time/i.test(h)) || Object.keys(parsed[0])[0]);
        setValueColumn(Object.keys(parsed[0]).find(h => /value|wert|reading/i.test(h)) || (Object.keys(parsed[0]).length > 1 ? Object.keys(parsed[0])[1] : ''));
        setFileFormat('csv'); setStep('mapping');
      }
    } catch (err) { setError(`Failed to parse file: ${err instanceof Error ? err.message : 'Error'}`); }
  };

  const getPreviewData = (): PreviewReading[] => {
    if (fileFormat() !== 'csv') { return jsonReadings().map(r => ({ meterId: r.meterId, date: new Date(r.date), value: r.value, originalDate: r.date, originalValue: String(r.value) })); }
    const mId = targetMeterId(); const dCol = dateColumn(); const vCol = valueColumn();
    if (!mId || !dCol || !vCol) { return []; }
    return csvData().reduce((acc: PreviewReading[], row) => {
      const date = new Date(row[dCol]); const value = parseLocaleNumber(row[vCol]);
      if (!isNaN(date.getTime()) && !isNaN(value)) { acc.push({ meterId: mId, date, value, originalDate: row[dCol], originalValue: row[vCol] }); }
      return acc;
    }, []);
  };

  const onBack = () => {
    if (step() === 'mapping') { setStep('upload'); }
    else if (step() === 'new-meter') { setStep(props.meters.length > 0 ? 'mapping' : 'upload'); }
    else if (step() === 'preview') { setStep(backupData() ? 'upload' : 'mapping'); }
  };

  createEffect(on(() => props.isOpen, (isOpen) => { if (isOpen) { untrack(reset); } }));

  return (
    <Show when={props.isOpen}><Portal><div class="modal modal-open"><div class="modal-box w-11/12 max-w-2xl"><h3 class="font-bold text-lg">Import Data</h3>
      <div class="py-4">
        <Show when={props.meters.length === 0 && step() === 'upload'}><EmptyState title="No meters" description="Create one first." inline={true} onAction={() => setStep('new-meter')} actionLabel="Create Meter" colorScheme="warning" /></Show>
        {error() && <div class="alert alert-error mb-4">{error()}</div>}
        <Show when={step() === 'upload'}><StepUpload onFileSelected={handleFileSelected} onPasteClick={async () => handleFileSelected(new File([await navigator.clipboard.readText()], 'paste.csv'))} /></Show>
        <Show when={step() === 'mapping'}><StepMapping meters={props.meters} targetMeterId={targetMeterId()} setTargetMeterId={setTargetMeterId} headers={headers()} dateColumn={dateColumn()} setDateColumn={setDateColumn} valueColumn={valueColumn()} setValueColumn={setValueColumn} onCreateNewMeter={() => setStep('new-meter')} /></Show>
        <Show when={step() === 'new-meter'}><MeterForm name={newMeterName()} setName={setNewMeterName} meterNumber={newMeterNumber()} setMeterNumber={setNewMeterNumber} type={newMeterType()} setType={setNewMeterType} unit={newMeterUnit()} setUnit={setNewMeterUnit} isLoading={isCreatingMeter()} compact={true} /></Show>
        <Show when={step() === 'preview'}><StepPreview data={getPreviewData()} backupInfo={backupData() ?? undefined} existingMeters={props.meters} /></Show>
        <Show when={step() === 'importing'}><div class="flex justify-center p-10"><span class="loading loading-spinner loading-lg"></span></div></Show>
      </div>
      <ModalFooter step={step()} onClose={props.onClose} onBack={onBack} onNext={() => (targetMeterId() && dateColumn() && valueColumn()) ? setStep('preview') : setError('Map all fields.')} onImport={async () => { setStep('importing'); try { await props.onSave(backupData() || getPreviewData()); props.onClose(); } catch (_e) { setError('Import failed'); setStep('preview'); } }} onCreateMeter={handleCreateNewMeter} isCreatingMeter={isCreatingMeter()} hasBackup={!!backupData()} />
    </div></div></Portal></Show>
  );
};

export default UnifiedImportModal;
