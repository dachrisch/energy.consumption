import { Component, Show, createSignal, For, createEffect } from 'solid-js';
import { Portal } from 'solid-js/web';
import { parseCsv } from '../lib/csvParser';
import { parseLocaleNumber } from '../lib/numberUtils';

interface Meter {
  _id: string;
  name: string;
}

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (readings: any[]) => Promise<void>;
  meters: Meter[];
}

type Step = 'upload' | 'mapping' | 'preview' | 'importing';

const CsvImportModal: Component<CsvImportModalProps> = (props) => {
  const [step, setStep] = createSignal<Step>('upload');
  const [csvData, setCsvData] = createSignal<Record<string, string>[]>([]);
  const [headers, setHeaders] = createSignal<string[]>([]);
  
  // New Mapping State
  const [targetMeterId, setTargetMeterId] = createSignal<string>('');
  const [dateColumn, setDateColumn] = createSignal<string>('');
  const [valueColumn, setValueColumn] = createSignal<string>('');
  
  const [error, setError] = createSignal<string | null>(null);

  const reset = () => {
    setStep('upload');
    setCsvData([]);
    setHeaders([]);
    setTargetMeterId('');
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
      
      // Heuristic for auto-selection
      const dateCol = cols.find(h => /date|datum/i.test(h)) || cols[0];
      const valCol = cols.find(h => /value|wert|strom|gas|wasser/i.test(h)) || (cols.length > 1 ? cols[1] : '');
      
      setDateColumn(dateCol);
      setValueColumn(valCol);
      
      setStep('mapping');
      setError(null);
    } catch (err) {
      setError('Failed to parse content');
    }
  };

  const handlePasteButtonClick = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) {
        setError('Clipboard is empty');
        return;
      }
      handleTextProcess(text);
    } catch (err) {
      setError('Failed to read clipboard. Please paste manually into the box below.');
    }
  };

  const handleManualPaste = (e: InputEvent) => {
    const text = (e.target as HTMLTextAreaElement).value;
    if (text) {
      handleTextProcess(text);
    }
  };

  const getPreviewData = () => {
    const data = csvData();
    const meterId = targetMeterId();
    const dateCol = dateColumn();
    const valCol = valueColumn();
    
    if (!meterId || !dateCol || !valCol) {return [];}

    const result: any[] = [];
    
    data.forEach(row => {
      const dateStr = row[dateCol];
      const date = parseDate(dateStr);
      
      if (!date) {return;}

      const valStr = row[valCol];
      if (!valStr) {return;}
      
      const value = parseLocaleNumber(valStr);
      if (isNaN(value)) {return;}

      result.push({
        meterId,
        date,
        value,
        originalDate: dateStr,
        originalValue: valStr
      });
    });

    return result;
  };

  const handleNextToPreview = () => {
     if (!targetMeterId()) {
         setError('Please select a target meter.');
         return;
     }
     if (!dateColumn() || !valueColumn()) {
         setError('Please map both Date and Value columns.');
         return;
     }
     setStep('preview');
     setError(null);
  };

  const handleImport = async () => {
    setStep('importing');
    try {
      const readings = getPreviewData().map(r => ({
          meterId: r.meterId,
          date: r.date,
          value: r.value
      }));
      await props.onSave(readings);
      props.onClose();
    } catch (e) {
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
               {error() && <div class="alert alert-error mb-4">{error()}</div>}

               <Show when={step() === 'upload'}>
                 <div class="flex flex-col gap-4">
                    <div 
                      class="flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-lg cursor-pointer hover:bg-base-200 transition-colors"
                      onClick={handlePasteButtonClick}
                    >
                        <p class="text-xl font-semibold">Paste from Clipboard</p>
                        <p class="text-sm opacity-60">Click here or use the box below</p>
                    </div>
                    
                    <div class="form-control">
                      <label class="label">
                        <span class="label-text">Or paste data manually here (CSV or Tab-separated):</span>
                      </label>
                      <textarea 
                        class="textarea textarea-bordered h-32 font-mono text-xs" 
                        placeholder="Date	Value..."
                        onInput={(e) => handleManualPaste(e)}
                      ></textarea>
                    </div>
                 </div>
               </Show>

               <Show when={step() === 'mapping'}>
                 <div class="space-y-6">
                    <div class="form-control w-full">
                        <label class="label">
                            <span class="label-text font-bold">1. Select Target Meter</span>
                        </label>
                        <select 
                            class="select select-bordered w-full" 
                            value={targetMeterId()} 
                            onChange={(e) => setTargetMeterId(e.currentTarget.value)}
                        >
                            <option value="" disabled selected>Choose Meter...</option>
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
                                value={dateColumn()} 
                                onChange={(e) => setDateColumn(e.currentTarget.value)}
                            >
                                <For each={headers()}>{(header) => (
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
                                value={valueColumn()} 
                                onChange={(e) => setValueColumn(e.currentTarget.value)}
                            >
                                <For each={headers()}>{(header) => (
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
                                        <For each={headers()}>{(h) => <th>{h}</th>}</For>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <For each={headers()}>{(h) => <td>{csvData()[0]?.[h]}</td>}</For>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                 </div>
               </Show>

               <Show when={step() === 'preview'}>
                  <p class="mb-4 font-bold">Preview Readings ({getPreviewData().length})</p>
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
                              <For each={getPreviewData()}>{(row) => (
                                  <tr>
                                      <td>{row.date.toLocaleDateString()}</td>
                                      <td class="font-bold">{row.value}</td>
                                      <td class="opacity-50 italic">{row.originalDate} | {row.originalValue}</td>
                                  </tr>
                              )}</For>
                          </tbody>
                      </table>
                  </div>
               </Show>
               
               <Show when={step() === 'importing'}>
                   <div class="flex justify-center p-10">
                       <span class="loading loading-spinner loading-lg"></span>
                   </div>
               </Show>
            </div>

            <div class="modal-action">
              <Show when={step() === 'upload'}>
                  <button class="btn" onClick={props.onClose}>Cancel</button>
              </Show>
              <Show when={step() === 'mapping'}>
                  <button class="btn" onClick={() => setStep('upload')}>Back</button>
                  <button class="btn btn-primary" onClick={handleNextToPreview}>Next: Preview</button>
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
