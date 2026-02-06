import { Component, Show, createSignal, For, createEffect, on, untrack } from 'solid-js';
import { Portal } from 'solid-js/web';
import { parseCsv } from '../lib/csvParser';
import { validateJsonStructure, isUnifiedExportFormat, parseUnifiedFormat } from '../lib/jsonParser';
import { detectFileType } from '../lib/fileTypeDetector';
import { parseLocaleNumber } from '../lib/numberUtils';
import MeterForm from './MeterForm';
import EmptyState from './EmptyState';

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
        <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <span class="text-lg font-black">Paste from Clipboard</span>
        <span class="text-[10px] opacity-60 font-bold uppercase tracking-widest">Click to auto-fill</span>
      </button>

      <div class="divider opacity-20 text-xs font-black uppercase tracking-[0.2em]">OR</div>

      <div
        class="border-2 border-dashed border-base-content/20 h-32 flex flex-col items-center justify-center gap-2 rounded-2xl cursor-pointer transition-all hover:border-primary/30 hover:bg-base-200/30"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef?.click()}
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
        </svg>
        <span class="font-bold text-sm">Drop file here or click</span>
        <span class="text-xs opacity-60">JSON or CSV files supported</span>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.csv"
          class="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              props.onFileSelected(file);
            }
          }}
        />
      </div>

      <div class="text-xs opacity-50 px-1">
        <p class="font-semibold mb-2">Supported formats:</p>
        <ul class="list-disc list-inside space-y-1 text-[11px]">
          <li><strong>JSON (Backup):</strong> Unified export format</li>
          <li><strong>JSON (Array):</strong> Array of objects with date and value</li>
          <li><strong>CSV/TSV:</strong> Standard comma or semicolon separated</li>
        </ul>
      </div>
    </div>
  );
};

const StepMapping: Component<{
  meters: Meter[];
  targetMeterId: string;
  setTargetMeterId: (v: string) => void;
  headers: string[];
  dateColumn: string;
  setDateColumn: (v: string) => void;
  valueColumn: string;
  setValueColumn: (v: string) => void;
  sampleRow?: Record<string, string>;
  onCreateNewMeter?: () => void;
}> = (props) => (
  <div class="space-y-6">
    <div class="form-control w-full flex flex-col gap-2">
      <label class="px-1">
        <span class="label-text font-black uppercase text-xs tracking-widest opacity-60">
          1. Select Target Meter
        </span>
      </label>
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
        <option value="" disabled>
          Choose Meter...
        </option>
        <For each={props.meters}>
          {(meter) => <option value={meter._id}>{meter.name}</option>}
        </For>
        <option value="NEW_METER" class="text-primary font-bold">
          + Register New Meter...
        </option>
      </select>
    </div>

    <div class="grid grid-cols-2 gap-4">
      <div class="form-control flex flex-col gap-2">
        <label class="px-1">
          <span class="label-text font-black uppercase text-xs tracking-widest opacity-60">
            2. Date Column
          </span>
        </label>
        <select
          class="select select-bordered h-12 rounded-xl bg-base-200/50 border-none font-bold focus:ring-2 focus:ring-primary px-4"
          value={props.dateColumn}
          onChange={(e) => props.setDateColumn(e.currentTarget.value)}
        >
          <For each={props.headers}>
            {(header) => <option value={header}>{header}</option>}
          </For>
        </select>
      </div>

      <div class="form-control flex flex-col gap-2">
        <label class="px-1">
          <span class="label-text font-black uppercase text-xs tracking-widest opacity-60">
            3. Value Column
          </span>
        </label>
        <select
          class="select select-bordered h-12 rounded-xl bg-base-200/50 border-none font-bold focus:ring-2 focus:ring-primary px-4"
          value={props.valueColumn}
          onChange={(e) => props.setValueColumn(e.currentTarget.value)}
        >
          <For each={props.headers}>
            {(header) => <option value={header}>{header}</option>}
          </For>
        </select>
      </div>
    </div>

    <div class="bg-base-200/30 border border-base-content/5 p-4 rounded-2xl">
      <p class="text-[10px] font-black uppercase tracking-widest opacity-50 mb-3">
        Data Sample
      </p>
      <div class="overflow-x-auto">
        <table class="table table-xs">
          <thead>
            <tr>
              <For each={props.headers}>
                {(h) => <th class="font-bold text-xs">{h}</th>}
              </For>
            </tr>
          </thead>
          <tbody>
            <tr>
              <For each={props.headers}>
                {(h) => <td class="text-xs">{props.sampleRow?.[h]}</td>}
              </For>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

const StepPreview: Component<{ 
  data: PreviewReading[]; 
  backupInfo?: ImportData;
  existingMeters: Meter[];
}> = (props) => {
  const getMeterName = (meterId: string) => {
    const backupMeter = props.backupInfo?.data?.meters?.find((m) => m.id === meterId);
    if (backupMeter) {
      return backupMeter.name;
    }
    const existingMeter = props.existingMeters.find((m) => m._id === meterId);
    if (existingMeter) return existingMeter.name;
    return 'Unknown Meter';
  };

  const willCreateMeter = (m: any) => {
    return !props.existingMeters.find(em => em.meterNumber === m.meterNumber);
  };

  return (
    <div class="space-y-6">
      <Show when={props.backupInfo?.data?.meters && props.backupInfo.data.meters.length > 0}>
         <div class="space-y-4">
           <div>
             <p class="text-[10px] font-black uppercase tracking-widest opacity-50 mb-2">Meters to Sync</p>
             <div class="grid grid-cols-1 gap-2">
               <For each={props.backupInfo!.data!.meters!}>
                {(m) => {
                  const creating = willCreateMeter(m);
                  return (
                    <div class="flex items-center justify-between p-3 bg-base-200/50 rounded-xl border border-base-content/5">
                      <div class="flex flex-col">
                        <span class="font-bold text-sm">{m.name}</span>
                        <span class="text-[10px] opacity-50">{m.meterNumber} • {m.type} ({m.unit})</span>
                      </div>
                      <span class={`badge badge-sm font-bold ${creating ? 'badge-primary' : 'badge-ghost opacity-50'}`}>
                        {creating ? 'NEW' : 'EXISTING'}
                      </span>
                    </div>
                  );
                }}
              </For>
            </div>
          </div>

           <Show when={props.backupInfo?.data?.contracts && props.backupInfo.data.contracts.length > 0}>
             <div>
               <p class="text-[10px] font-black uppercase tracking-widest opacity-50 mb-2">Contracts to Import</p>
               <div class="grid grid-cols-1 gap-2">
                 <For each={props.backupInfo!.data!.contracts!}>
                  {(c) => (
                    <div class="flex items-center justify-between p-3 bg-base-200/50 rounded-xl border border-base-content/5">
                      <div class="flex flex-col">
                        <span class="font-bold text-sm">{c.providerName}</span>
                        <span class="text-[10px] opacity-50">Meter: {getMeterName(c.meterId)}</span>
                      </div>
                      <span class="text-[10px] font-bold opacity-50 uppercase text-right">Restoring</span>
                    </div>
                  )}
                </For>
              </div>
            </div>
          </Show>
        </div>
      </Show>

      <div>
        <p class="text-[10px] font-black uppercase tracking-widest opacity-50 mb-2">
          {props.backupInfo ? 'Readings to Import' : 'Preview Readings'} ({props.data.length})
        </p>
        <div class="overflow-x-auto max-h-64 border border-base-content/10 rounded-2xl bg-base-200/20">
          <table class="table table-xs table-pin-rows">
            <thead>
              <tr>
                <th class="font-bold text-xs">Meter</th>
                <th class="font-bold text-xs">Date</th>
                <th class="font-bold text-xs text-right">Value</th>
              </tr>
            </thead>
            <tbody>
              <For each={props.data}>
                {(row) => (
                  <tr>
                    <td class="text-[10px] font-bold opacity-70 truncate max-w-[120px]">{getMeterName(row.meterId)}</td>
                    <td class="text-xs">{row.date.toLocaleDateString()}</td>
                    <td class="font-bold text-xs text-right">{row.value}</td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

type Step = 'upload' | 'mapping' | 'preview' | 'importing' | 'new-meter';
type FileFormat = 'csv' | 'json-nested' | 'json-flat';

const UnifiedImportModal: Component<UnifiedImportModalProps> = (props) => {
  const [step, setStep] = createSignal<Step>('upload');
  const [fileFormat, setFileFormat] = createSignal<FileFormat>('csv');
  const [csvData, setCsvData] = createSignal<Record<string, string>[]>([]);
  const [jsonReadings, setJsonReadings] = createSignal<
    Array<{ meterId: string; date: string; value: number }>
  >([]);
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

  const reset = () => {
    setStep('upload');
    setFileFormat('csv');
    setCsvData([]);
    setJsonReadings([]);
    setBackupData(null);
    setHeaders([]);
    setTargetMeterId(props.meters[0]?._id || '');
    setDateColumn('');
    setValueColumn('');
    setError(null);
    setNewMeterName('');
    setNewMeterNumber('');
    setNewMeterType('power');
    setNewMeterUnit('kWh');
    setIsCreatingMeter(false);
  };

  const handleCreateNewMeter = async () => {
    const name = newMeterName();
    const meterNumber = newMeterNumber();
    const type = newMeterType();
    const unit = newMeterUnit();

    if (!name || !meterNumber) {
      setError('Please enter meter name and number');
      return;
    }

    setIsCreatingMeter(true);
    try {
      const res = await fetch('/api/meters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, meterNumber, type, unit })
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error || 'Failed to create meter');
        return;
      }

      const newMeter = await res.json();
      setTargetMeterId(newMeter._id);
      props.onMeterCreated?.(newMeter);
      setStep('mapping');
      setError(null);
      setNewMeterName('');
      setNewMeterNumber('');
      setNewMeterType('power');
      setNewMeterUnit('kWh');
    } catch (_err) {
      setError('Failed to create meter');
    } finally {
      setIsCreatingMeter(false);
    }
  };

  createEffect(on(() => props.isOpen, (isOpen) => {
    if (isOpen) {
      untrack(reset);
    }
  }));

  const parseDate = (dateStr: string): Date | null => {
    if (!dateStr) {
      return null;
    }
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date;
    }
    const euMatch = dateStr.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})/);
    if (euMatch) {
      return new Date(
        `${euMatch[3]}-${euMatch[2].padStart(2, '0')}-${euMatch[1].padStart(2, '0')}`
      );
    }
    return null;
  };

   const processJsonFile = (content: string) => {
     try {
       const jsonData = JSON.parse(content);
       console.log('📋 Parsed JSON data:', jsonData);
       
       // 1. Unified backup format (Direct to preview)
       if (isUnifiedExportFormat(jsonData)) {
         console.log('📋 Detected format: unified backup');
         const result = parseUnifiedFormat(jsonData);
         
         setBackupData(jsonData);
         setJsonReadings(
           result.readings.map((r) => ({
             meterId: r.meterId,
             date: r.date,
             value: r.value
           }))
         );

         setFileFormat('json-nested');
         setStep('preview');
         return;
       }

       // 2. Simple array of objects (Generic JSON for mapping)
       if (Array.isArray(jsonData) && jsonData.length > 0 && typeof jsonData[0] === 'object' && jsonData[0] !== null) {
         console.log('📋 Detected as mappable JSON array');
         const firstItem = jsonData[0] as Record<string, unknown>;
         const cols = Object.keys(firstItem);
         
         // Convert all values to strings for consistent processing by mapping logic
         setCsvData(jsonData.map(row => {
           const newRow: Record<string, string> = {};
           Object.entries(row).forEach(([k, v]) => {
             newRow[k] = v === null || v === undefined ? '' : String(v);
           });
           return newRow;
         }));
         setHeaders(cols);
         
         // Auto-detect columns
         setDateColumn(cols.find((h) => /date|datum|time/i.test(h)) || cols[0]);
         setValueColumn(
           cols.find((h) => /value|wert|reading|strom|gas|wasser/i.test(h)) ||
             (cols.length > 1 ? cols[1] : '')
         );

         setFileFormat('csv'); // Treating as CSV-like source for mapping UI
         setStep('mapping');
         return;
       }

       // 3. Specific error for old formats to guide users
       try {
         const format = validateJsonStructure(jsonData);
         if (format === 'nested' || format === 'flat') {
           throw new Error('This file uses an older export format. Please use the new Export feature to create a compatible backup.');
         }
       } catch (_e) { /* ignore */ }

       throw new Error('Unsupported JSON structure. Use a JSON array of objects or the official backup format.');
     } catch (err) {
       console.error('❌ JSON processing error:', err);
       throw err instanceof Error ? err : new Error(`Failed to parse JSON: ${String(err)}`);
     }
   };

  const processCsvFile = (content: string) => {
    const parsed = parseCsv(content);
    if (parsed.length === 0) {
      setError('No data found in file');
      return;
    }
    const cols = Object.keys(parsed[0]);
    setCsvData(parsed);
    setHeaders(cols);

    setDateColumn(cols.find((h) => /date|datum|time/i.test(h)) || cols[0]);
    setValueColumn(
      cols.find((h) => /value|wert|reading|strom|gas|wasser/i.test(h)) ||
        (cols.length > 1 ? cols[1] : '')
    );

    setFileFormat('csv');
    setStep('mapping');
  };

   const handleFileSelected = async (file: File) => {
     try {
       setError(null);
       console.log('📁 File selected:', file.name, 'Size:', file.size);
       const content = await file.text();
       console.log('📁 File content preview:', content.substring(0, 100));
       const detectedType = detectFileType(file.name, content);
       console.log('📁 Detected file type:', detectedType);

       if (detectedType === 'json') {
         processJsonFile(content);
       } else {
         processCsvFile(content);
       }
     } catch (err) {
       console.error('❌ File handling error:', err);
       setError(`Failed to parse file: ${err instanceof Error ? err.message : 'Unknown error'}`);
     }
   };

  const getPreviewData = (): PreviewReading[] => {
    if (fileFormat() !== 'csv') {
      // For JSON formats, readings are already parsed with meterId
      return jsonReadings().map((r) => ({
        meterId: r.meterId,
        date: new Date(r.date),
        value: r.value,
        originalDate: r.date,
        originalValue: String(r.value)
      }));
    }

    // For CSV, need to map columns
    const data = csvData();
    const meterId = targetMeterId();
    const dateCol = dateColumn();
    const valCol = valueColumn();

    if (!meterId || !dateCol || !valCol) {
      return [];
    }

    const result: PreviewReading[] = [];
    data.forEach((row) => {
      const date = parseDate(row[dateCol]);
      const value = parseLocaleNumber(row[valCol]);
      if (date && !isNaN(value)) {
        result.push({
          meterId,
          date,
          value,
          originalDate: row[dateCol],
          originalValue: row[valCol]
        });
      }
    });
    return result;
  };

  const handleImport = async () => {
     setStep('importing');
     try {
       const data = backupData();
       if (data) {
         await props.onSave(data);
       } else {
         await props.onSave(getPreviewData());
       }
       props.onClose();
     } catch (_e) {
       setError('Import failed');
       setStep('preview');
     }
   };

  const handlePasteClick = async () => {
    try {
      const text = await navigator.clipboard.readText();
      handlePasteContent(text);
    } catch (_err) {
      setError('Could not read clipboard. Try manual paste instead.');
    }
  };

  const handlePasteContent = (content: string) => {
     const trimmed = content.trim();
     if (!trimmed) {
       setError('Please paste some data');
       return;
     }

     try {
       setError(null);
       console.log('📋 Pasted content preview:', trimmed.substring(0, 100));
       
       // Improved detection
       if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
         console.log('🔍 Detected as JSON, processing...');
         processJsonFile(trimmed);
       } else {
         console.log('🔍 Detected as CSV, processing...');
         processCsvFile(trimmed);
       }
     } catch (err) {
       console.error('❌ Paste handling error:', err);
       setError(err instanceof Error ? err.message : 'Failed to parse data');
     }
   };

  return (
    <Show when={props.isOpen}>
      <Portal>
        <div class="modal modal-open">
          <div class="modal-box w-11/12 max-w-2xl">
            <h3 class="font-bold text-lg">Import Data</h3>
            <div class="py-4">
              <Show when={props.meters.length === 0 && step() === 'upload'}>
                <EmptyState
                  title="No meters found"
                  description="Create a new meter or register one first."
                  inline={true}
                  onAction={() => setStep('new-meter')}
                  actionLabel="Create Meter"
                  colorScheme="warning"
                />
              </Show>

              {error() && <div class="alert alert-error mb-4">{error()}</div>}

              <Show when={step() === 'upload'}>
                <StepUpload 
                  onFileSelected={handleFileSelected}
                  onPasteClick={handlePasteClick}
                />
              </Show>

              <Show when={step() === 'mapping'}>
                <StepMapping
                  meters={props.meters}
                  targetMeterId={targetMeterId()}
                  setTargetMeterId={setTargetMeterId}
                  headers={headers()}
                  dateColumn={dateColumn()}
                  setDateColumn={setDateColumn}
                  valueColumn={valueColumn()}
                  setValueColumn={setValueColumn}
                  sampleRow={csvData()[0]}
                  onCreateNewMeter={() => setStep('new-meter')}
                />
              </Show>

              <Show when={step() === 'new-meter'}>
                <MeterForm
                  name={newMeterName()}
                  setName={setNewMeterName}
                  meterNumber={newMeterNumber()}
                  setMeterNumber={setNewMeterNumber}
                  type={newMeterType()}
                  setType={setNewMeterType}
                  unit={newMeterUnit()}
                  setUnit={setNewMeterUnit}
                  isLoading={isCreatingMeter()}
                  compact={true}
                />
              </Show>

              <Show when={step() === 'preview'}>
                <StepPreview 
                  data={getPreviewData()} 
                  backupInfo={backupData() ?? undefined} 
                  existingMeters={props.meters}
                />
              </Show>

              <Show when={step() === 'importing'}>
                <div class="flex justify-center p-10">
                  <span class="loading loading-spinner loading-lg"></span>
                </div>
              </Show>
            </div>

            <div class="modal-action">
              <Show when={step() === 'upload'}>
                <button class="btn" onClick={props.onClose}>
                  Cancel
                </button>
              </Show>

              <Show when={step() === 'mapping'}>
                <button class="btn" onClick={() => setStep('upload')}>
                  Back
                </button>
                <button
                  class="btn btn-primary"
                  onClick={() => {
                    if (targetMeterId() && dateColumn() && valueColumn()) {
                      setStep('preview');
                    } else {
                      setError('Please map all fields.');
                    }
                  }}
                >
                  Next: Preview
                </button>
              </Show>

              <Show when={step() === 'new-meter'}>
                <button
                  class="btn"
                  onClick={() => setStep(props.meters.length > 0 ? 'mapping' : 'upload')}
                  disabled={isCreatingMeter()}
                >
                  Back
                </button>
                <button
                  class="btn btn-primary"
                  onClick={handleCreateNewMeter}
                  disabled={isCreatingMeter()}
                >
                  <Show when={isCreatingMeter()} fallback="Create Meter">
                    <span class="loading loading-spinner loading-sm"></span>
                  </Show>
                </button>
              </Show>

              <Show when={step() === 'preview'}>
                <button class="btn" onClick={() => setStep(backupData() ? 'upload' : 'mapping')}>
                  Back
                </button>
                <button class="btn btn-primary" onClick={handleImport}>
                  {backupData() ? 'Restore Backup' : 'Import Data'}
                </button>
              </Show>
            </div>
          </div>
        </div>
      </Portal>
    </Show>
  );
};

export default UnifiedImportModal;
