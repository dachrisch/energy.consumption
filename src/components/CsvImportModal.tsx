import { Component, Show, createSignal, For, createEffect } from 'solid-js';
import { Portal } from 'solid-js/web';
import { parseCsv } from '../lib/csvParser';

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
  const [mapping, setMapping] = createSignal<Record<string, string>>({}); // Header -> MeterID
  const [error, setError] = createSignal<string | null>(null);

  const reset = () => {
    setStep('upload');
    setCsvData([]);
    setHeaders([]);
    setMapping({});
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
      const headers = Object.keys(parsed[0]);
      setCsvData(parsed);
      setHeaders(headers);
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

  const handleMappingChange = (header: string, meterId: string) => {
    setMapping(prev => ({ ...prev, [header]: meterId }));
  };

  const parseValue = (val: string) => {
    // Handle "3877,3" -> 3877.3
    return parseFloat(val.replace(',', '.').replace(/\s/g, ''));
  };

  const parseDate = (dateStr: string) => {
    // Try ISO
    let date = new Date(dateStr);
    if (!isNaN(date.getTime())) {return date;}

    // Try dd.mm.yyyy (European)
    const euMatch = dateStr.match(/^(\d{2})\.(\d{2})\.(\d{4})/);
    if (euMatch) {
      return new Date(`${euMatch[3]}-${euMatch[2]}-${euMatch[1]}`);
    }
    
    return null;
  };

  const getPreviewData = () => {
    const data = csvData();
    const map = mapping();
    const result: any[] = [];
    
    // Find Date header (heuristic: contains 'date' or 'datum' or check values?)
    // For now, let user map "Date" column to a special key or auto-detect?
    // Let's assume user maps a header to "Date" (special) or we detect "Date"
    // Actually, in the spec: "User maps each header to a specific existing Meter...".
    // Where is the date?
    // The example: "Date Strom ..."
    // So there is a Date column. We need to identify it.
    // Let's force user to identify the Date column or auto-detect 'Date'/'Datum'.
    
    // Heuristic: Header with 'date' or 'datum' is the date column.
    // Remaining mapped headers are values for meters.
    
    let dateHeader = headers().find(h => /date|datum/i.test(h));
    
    if (!dateHeader) {
        // Fallback: Use the first unmapped column? Or asking user is better.
        // For simplicity/MVP: assume 'Date' or 'Datum' exists.
        // Or if one header is mapped to nothing/special.
    }

    if (!dateHeader) {
        // If we can't find a date header, we can't proceed.
        // In a real app, we'd add a selector "Which column is Date?".
        // For this MVP, let's pick the first column if no "Date" match.
        dateHeader = headers()[0]; 
    }

    data.forEach(row => {
      const dateStr = row[dateHeader!];
      const date = parseDate(dateStr);
      
      if (!date) {return;} // Skip invalid dates

      Object.entries(map).forEach(([header, meterId]) => {
        if (header === dateHeader || !meterId || meterId === 'ignore') {return;}
        
        const valStr = row[header];
        if (!valStr) {return;}
        
        const value = parseValue(valStr);
        if (isNaN(value)) {return;}

        result.push({
          meterId,
          date,
          value,
          originalDate: dateStr,
          originalValue: valStr
        });
      });
    });

    return result;
  };

  const handleNextToPreview = () => {
     // Validate that at least one meter is mapped
     const map = mapping();
     const hasMeter = Object.values(map).some(v => v && v !== 'ignore');
     if (!hasMeter) {
         setError('Please map at least one column to a meter.');
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
          <div class="modal-box w-11/12 max-w-5xl">
            <h3 class="font-bold text-lg">Import Readings from CSV</h3>
            
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
                 <p class="mb-4">Map CSV columns to your Meters.</p>
                 <div class="grid grid-cols-2 gap-4">
                    <For each={headers()}>{(header) => (
                        <div class="card bg-base-100 shadow-sm border p-4">
                            <label class="label">
                                <span class="label-text font-bold">{header}</span>
                                <span class="label-text-alt text-xs opacity-50">Sample: {csvData()[0]?.[header]}</span>
                            </label>
                            <select 
                                class="select select-bordered w-full" 
                                value={mapping()[header] || ''} 
                                onChange={(e) => handleMappingChange(header, e.currentTarget.value)}
                            >
                                <option value="" disabled selected>Select Meter...</option>
                                <option value="ignore">Ignore</option>
                                <For each={props.meters}>{(meter) => (
                                    <option value={meter._id}>{meter.name}</option>
                                )}</For>
                            </select>
                        </div>
                    )}</For>
                 </div>
               </Show>

               <Show when={step() === 'preview'}>
                  <p class="mb-4">Preview Readings ({getPreviewData().length})</p>
                  <div class="overflow-x-auto max-h-96">
                      <table class="table table-xs">
                          <thead>
                              <tr>
                                  <th>Date</th>
                                  <th>Meter</th>
                                  <th>Value</th>
                              </tr>
                          </thead>
                          <tbody>
                              <For each={getPreviewData()}>{(row) => (
                                  <tr>
                                      <td>{row.date.toLocaleDateString()}</td>
                                      <td>{props.meters.find(m => m._id === row.meterId)?.name || row.meterId}</td>
                                      <td>{row.value}</td>
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