import { Component, Show, createSignal, For, createEffect } from 'solid-js';
import { Portal } from 'solid-js/web';
import { parseCsv } from '../lib/csvParser';
import { parseLocaleNumber } from '../lib/numberUtils';

interface Meter {
  _id: string;
  name: string;
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

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (readings: ImportReading[]) => Promise<void>;
  meters: Meter[];
}

const StepUpload: Component<{ onPasteClick: () => void, onManualPaste: (e: { target: HTMLTextAreaElement }) => void }> = (props) => (
  <div class="flex flex-col gap-6">
    <button 
      class="btn btn-outline btn-lg border-2 border-dashed h-32 flex flex-col gap-1 hover:bg-base-200 normal-case w-full"
      onClick={props.onPasteClick}
    >
        <span class="text-xl font-black">Paste from Clipboard</span>
        <span class="text-xs opacity-60 font-bold uppercase tracking-widest">Click here to auto-fill</span>
    </button>
    <div class="divider opacity-20 text-xs font-black uppercase tracking-[0.2em]">OR</div>
    <div class="form-control w-full">
      <label class="label">
        <span class="label-text font-black uppercase text-xs tracking-widest opacity-60">Manual Paste (CSV / Tab-separated)</span>
      </label>
      <textarea 
        class="textarea textarea-bordered w-full h-40 font-mono text-sm bg-base-200/50 border-none focus:ring-2 focus:ring-primary transition-all" 
        placeholder="01.01.2022	2.852..."
        onInput={props.onManualPaste}
      ></textarea>
    </div>
  </div>
);

const StepMapping: Component<{ 
  meters: Meter[], 
  targetMeterId: string, 
  setTargetMeterId: (v: string) => void,
  headers: string[],
  dateColumn: string,
  setDateColumn: (v: string) => void,
  valueColumn: string,
  setValueColumn: (v: string) => void,
  sampleRow?: Record<string, string>
}> = (props) => (
  <div class="space-y-6">
    <div class="form-control w-full">
        <label class="label">
            <span class="label-text font-bold">1. Select Target Meter</span>
        </label>
        <select 
            class="select select-bordered w-full" 
            value={props.targetMeterId} 
            onChange={(e) => props.setTargetMeterId(e.currentTarget.value)}
        >
            <option value="" disabled>Choose Meter...</option>
            <For each={props.meters}>{(meter) => (
                <option value={meter._id}>{meter.name}</option>
            )}</For>
        </select>
    </div>

    <div class="grid grid-cols-2 gap-4">
        <div class="form-control">
            <label class="label">
                <span class="label-text font-bold">2. Date Column</span>
            </label>
            <select 
                class="select select-bordered w-full" 
                value={props.dateColumn} 
                onChange={(e) => props.setDateColumn(e.currentTarget.value)}
            >
                <For each={props.headers}>{(header) => (
                    <option value={header}>{header}</option>
                )}</For>
            </select>
        </div>

        <div class="form-control">
            <label class="label">
                <span class="label-text font-bold">3. Value Column</span>
            </label>
            <select 
                class="select select-bordered w-full" 
                value={props.valueColumn} 
                onChange={(e) => props.setValueColumn(e.currentTarget.value)}
            >
                <For each={props.headers}>{(header) => (
                    <option value={header}>{header}</option>
                )}</For>
            </select>
        </div>
    </div>
    
    <div class="bg-base-200 p-4 rounded-lg">
        <p class="text-xs font-bold uppercase opacity-50 mb-2">Data Sample</p>
        <div class="overflow-x-auto">
            <table class="table table-xs">
                <thead>
                    <tr>
                        <For each={props.headers}>{(h) => <th>{h}</th>}</For>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <For each={props.headers}>{(h) => <td>{props.sampleRow?.[h]}</td>}</For>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
  </div>
);

const StepPreview: Component<{ data: PreviewReading[] }> = (props) => (
  <>
    <p class="mb-4 font-bold">Preview Readings ({props.data.length})</p>
    <div class="overflow-x-auto max-h-96 border rounded-lg">
        <table class="table table-xs table-pin-rows">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Value</th>
                    <th class="opacity-50 italic">Original</th>
                </tr>
            </thead>
            <tbody>
                <For each={props.data}>{(row) => (
                    <tr>
                        <td>{row.date.toLocaleDateString()}</td>
                        <td class="font-bold">{row.value}</td>
                        <td class="opacity-50 italic">{row.originalDate} | {row.originalValue}</td>
                    </tr>
                )}</For>
            </tbody>
        </table>
    </div>
  </>
);

type Step = 'upload' | 'mapping' | 'preview' | 'importing';

const CsvImportModal: Component<CsvImportModalProps> = (props) => {
  const [step, setStep] = createSignal<Step>('upload');
  const [csvData, setCsvData] = createSignal<Record<string, string>[]>([]);
  const [headers, setHeaders] = createSignal<string[]>([]);
  
  const [targetMeterId, setTargetMeterId] = createSignal<string>('');
  const [dateColumn, setDateColumn] = createSignal<string>('');
  const [valueColumn, setValueColumn] = createSignal<string>('');
  
  const [error, setError] = createSignal<string | null>(null);

  const reset = () => {
    setStep('upload');
    setCsvData([]);
    setHeaders([]);
    setTargetMeterId(props.meters[0]?._id || '');
    setDateColumn('');
    setValueColumn('');
    setError(null);
  };

  createEffect(() => {
    if (props.isOpen) {
      reset();
    }
  });

  const handleTextProcess = (text: string) => {
    try {
      const parsed = parseCsv(text);
      if (parsed.length === 0) {
        setError('No data found in pasted content');
        return;
      }
      const cols = Object.keys(parsed[0]);
      setCsvData(parsed);
      setHeaders(cols);
      
      setDateColumn(cols.find(h => /date|datum/i.test(h)) || cols[0]);
      setValueColumn(cols.find(h => /value|wert|strom|gas|wasser/i.test(h)) || (cols.length > 1 ? cols[1] : ''));
      
      setStep('mapping');
      setError(null);
    } catch (_err) {
      setError('Failed to parse content');
    }
  };

  const parseDate = (dateStr: string) => {
    if (!dateStr) {return null;}
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {return date;}
    const euMatch = dateStr.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})/);
    if (euMatch) {
      return new Date(`${euMatch[3]}-${euMatch[2].padStart(2, '0')}-${euMatch[1].padStart(2, '0')}`);
    }
    return null;
  };

  const getPreviewData = (): PreviewReading[] => {
    const data = csvData();
    const meterId = targetMeterId();
    const dateCol = dateColumn();
    const valCol = valueColumn();
    
    if (!meterId || !dateCol || !valCol) {return [];}

    const result: PreviewReading[] = [];
    data.forEach(row => {
      const date = parseDate(row[dateCol]);
      const value = parseLocaleNumber(row[valCol]);
      if (date && !isNaN(value)) {
        result.push({ meterId, date, value, originalDate: row[dateCol], originalValue: row[valCol] });
      }
    });
    return result;
  };

  const handleImport = async () => {
    setStep('importing');
    try {
      await props.onSave(getPreviewData());
      props.onClose();
    } catch (_e) {
      setError('Import failed');
      setStep('preview');
    }
  };

  return (
    <Show when={props.isOpen}>
      <Portal>
        <div class="modal modal-open">
          <div class="modal-box w-11/12 max-w-2xl">
            <h3 class="font-bold text-lg">Import Readings</h3>
            <div class="py-4">
               <Show when={props.meters.length === 0}>
                 <div class="alert alert-warning mb-6 shadow-sm border-none rounded-2xl flex items-start gap-4">
                    <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6 mt-0.5" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    <div>
                      <h3 class="font-black uppercase text-xs tracking-widest opacity-80 mb-1">No Meters Found</h3>
                      <p class="text-sm font-bold opacity-70">You must register at least one utility meter before you can import readings.</p>
                    </div>
                 </div>
               </Show>

               {error() && <div class="alert alert-error mb-4">{error()}</div>}

               <Show when={step() === 'upload'}>
                 <StepUpload 
                   onPasteClick={async () => handleTextProcess(await navigator.clipboard.readText())} 
                   onManualPaste={(e) => handleTextProcess(e.target.value)} 
                 />
               </Show>

               <Show when={step() === 'mapping'}>
                 <StepMapping 
                   meters={props.meters} targetMeterId={targetMeterId()} setTargetMeterId={setTargetMeterId}
                   headers={headers()} dateColumn={dateColumn()} setDateColumn={setDateColumn}
                   valueColumn={valueColumn()} setValueColumn={setValueColumn} sampleRow={csvData()[0]}
                 />
               </Show>

               <Show when={step() === 'preview'}><StepPreview data={getPreviewData()} /></Show>
               <Show when={step() === 'importing'}><div class="flex justify-center p-10"><span class="loading loading-spinner loading-lg"></span></div></Show>
            </div>

            <div class="modal-action">
              <Show when={step() === 'upload'}><button class="btn" onClick={props.onClose}>Cancel</button></Show>
              <Show when={step() === 'mapping'}>
                  <button class="btn" onClick={() => setStep('upload')}>Back</button>
                  <button class="btn btn-primary" onClick={() => { 
                    if (targetMeterId() && dateColumn() && valueColumn()) {
                      setStep('preview');
                    } else {
                      setError('Please map all fields.');
                    }
                  }}>Next: Preview</button>
              </Show>
              <Show when={step() === 'preview'}>
                  <button class="btn" onClick={() => setStep('mapping')}>Back</button>
                  <button class="btn btn-primary" onClick={handleImport}>Import Readings</button>
              </Show>
            </div>
          </div>
        </div>
      </Portal>
    </Show>
  );
};

export default CsvImportModal;
