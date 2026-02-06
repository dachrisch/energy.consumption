import { Component, createSignal, Show, For, createEffect } from 'solid-js';
import { Portal } from 'solid-js/web';

interface Meter {
  _id: string;
  name: string;
}

interface Reading {
  date: string;
}

interface Contract {
  _id: string;
  providerName: string;
}

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  meterCount: number;
  readingCount: number;
  contractCount: number;
  meters?: Meter[];
  readings?: Reading[];
  contracts?: Contract[];
}

const formatDateRange = (readings: Reading[]): string => {
   if (readings.length === 0) {
     return 'No data';
   }
   if (readings.length === 1) {
     return new Date(readings[0].date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
   }
  
  const firstDate = new Date(readings[0].date);
  const lastDate = new Date(readings[readings.length - 1].date);
  
  const first = firstDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  const last = lastDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  
  return `${first} → ${last}`;
};

const ExportModal: Component<ExportModalProps> = (props) => {
  const [includeMeters, setIncludeMeters] = createSignal(true);
  const [includeReadings, setIncludeReadings] = createSignal(true);
  const [includeContracts, setIncludeContracts] = createSignal(true);
  const [isLoading, setIsLoading] = createSignal(false);
  const [meters, setMeters] = createSignal<Meter[]>([]);
  const [readings, setReadings] = createSignal<Reading[]>([]);
  const [contracts, setContracts] = createSignal<Contract[]>([]);

  // Fetch data when modal opens
  createEffect(() => {
    if (props.isOpen) {
      Promise.all([
        fetch('/api/meters').then(r => r.ok ? r.json() : []),
        fetch('/api/readings').then(r => r.ok ? r.json() : []),
        fetch('/api/contracts').then(r => r.ok ? r.json() : [])
      ]).then(([m, rd, c]) => {
        setMeters(m || []);
        setReadings(rd || []);
        setContracts(c || []);
       }).catch((err) => {
         console.error('Failed to fetch data:', err);
       });
    }
  });

  const downloadFile = (data: unknown) => {
    const filename = `energy-export-${new Date().toISOString().split('T')[0]}.json`;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
  };

  const fetchExportData = async (options: { includeMeters: boolean; includeReadings: boolean; includeContracts: boolean }) => {
    console.log('📥 Starting export with options:', options);

    const response = await fetch('/api/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options)
    });

    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`);
    }

    return response.json();
  };

  const handleDownload = async () => {
     setIsLoading(true);
     try {
       const options = {
         includeMeters: includeMeters(),
         includeReadings: includeReadings(),
         includeContracts: includeContracts()
       };

       const data = await fetchExportData(options);
       console.log('📥 Export data received:', data);
       downloadFile(data);
       console.log('📥 Export completed successfully');
       props.onClose();
     } catch (error) {
       console.error('❌ Download error:', error);
       alert('Failed to export data. Please try again.');
     } finally {
       setIsLoading(false);
     }
   };

  return (
    <Show when={props.isOpen}>
      <Portal>
        <div class="modal modal-open">
          <div class="modal-box w-11/12 max-w-md">
            <h3 class="font-bold text-lg mb-6">Export Data</h3>

            {/* Checkboxes Section */}
            <div class="space-y-2 mb-8">
              {/* Meters Checkbox */}
              <label class="flex items-center gap-3 p-4 rounded-lg border-2 border-base-content/10 cursor-pointer hover:bg-base-200/30 hover:border-base-content/20 transition-all">
                <input
                  type="checkbox"
                  checked={includeMeters()}
                  onChange={(e) => setIncludeMeters(e.currentTarget.checked)}
                  class="checkbox checkbox-primary checkbox-lg"
                />
                <div class="flex-1 min-w-0">
                  <div class="font-bold text-base">Meters</div>
                  <div class="text-xs opacity-60">{props.meterCount} meter{props.meterCount !== 1 ? 's' : ''}</div>
                </div>
              </label>

              {/* Readings Checkbox */}
              <label class="flex items-center gap-3 p-4 rounded-lg border-2 border-base-content/10 cursor-pointer hover:bg-base-200/30 hover:border-base-content/20 transition-all">
                <input
                  type="checkbox"
                  checked={includeReadings()}
                  onChange={(e) => setIncludeReadings(e.currentTarget.checked)}
                  class="checkbox checkbox-primary checkbox-lg"
                />
                <div class="flex-1 min-w-0">
                  <div class="font-bold text-base">Readings</div>
                  <div class="text-xs opacity-60">{props.readingCount} reading{props.readingCount !== 1 ? 's' : ''}</div>
                </div>
              </label>

              {/* Contracts Checkbox */}
              <label class="flex items-center gap-3 p-4 rounded-lg border-2 border-base-content/10 cursor-pointer hover:bg-base-200/30 hover:border-base-content/20 transition-all">
                <input
                  type="checkbox"
                  checked={includeContracts()}
                  onChange={(e) => setIncludeContracts(e.currentTarget.checked)}
                  class="checkbox checkbox-primary checkbox-lg"
                />
                <div class="flex-1 min-w-0">
                  <div class="font-bold text-base">Contracts</div>
                  <div class="text-xs opacity-60">{props.contractCount} contract{props.contractCount !== 1 ? 's' : ''}</div>
                </div>
              </label>
            </div>

            {/* Preview Section */}
            <div class="bg-base-200/50 p-5 rounded-xl mb-6 border border-base-content/10">
              <p class="text-xs font-bold uppercase tracking-widest opacity-60 mb-4">Export Preview</p>
              <div class="space-y-3">
                {/* Meters Preview */}
                <Show when={includeMeters()}>
                  <div class="text-sm space-y-1">
                    <p class="font-semibold flex items-center gap-2">
                      <span class="text-primary">✓</span>
                      Meters ({meters().length})
                    </p>
                    <Show when={meters().length > 0}>
                      <ul class="ml-6 space-y-1 opacity-70 text-xs">
                        <For each={meters().slice(0, 3)}>
                          {(meter) => <li>• {meter.name}</li>}
                        </For>
                        <Show when={meters().length > 3}>
                          <li class="italic">+ {meters().length - 3} more...</li>
                        </Show>
                      </ul>
                    </Show>
                  </div>
                </Show>

                {/* Readings Preview */}
                <Show when={includeReadings()}>
                  <div class="text-sm space-y-1">
                    <p class="font-semibold flex items-center gap-2">
                      <span class="text-primary">✓</span>
                      Readings ({readings().length})
                    </p>
                    <Show when={readings().length > 0}>
                      <div class="ml-6 opacity-70 text-xs">
                        {formatDateRange(readings())}
                      </div>
                    </Show>
                  </div>
                </Show>

                {/* Contracts Preview */}
                <Show when={includeContracts()}>
                  <div class="text-sm space-y-1">
                    <p class="font-semibold flex items-center gap-2">
                      <span class="text-primary">✓</span>
                      Contracts ({contracts().length})
                    </p>
                    <Show when={contracts().length > 0}>
                      <ul class="ml-6 space-y-1 opacity-70 text-xs">
                        <For each={contracts().slice(0, 3)}>
                          {(contract) => <li>• {contract.providerName}</li>}
                        </For>
                        <Show when={contracts().length > 3}>
                          <li class="italic">+ {contracts().length - 3} more...</li>
                        </Show>
                      </ul>
                    </Show>
                  </div>
                </Show>

                {/* Empty State */}
                <Show when={!includeMeters() && !includeReadings() && !includeContracts()}>
                  <p class="text-sm opacity-60 text-center py-2 italic">No data selected for export</p>
                </Show>

                {/* Format Info */}
                <Show when={includeMeters() || includeReadings() || includeContracts()}>
                  <div class="pt-2 border-t border-base-content/10 text-xs opacity-60">
                    Format: Unified JSON with metadata
                  </div>
                </Show>
              </div>
            </div>

            {/* Actions */}
            <div class="modal-action">
              <button
                onClick={props.onClose}
                class="btn"
                disabled={isLoading()}
              >
                Cancel
              </button>
              <button
                onClick={handleDownload}
                disabled={isLoading() || (!includeMeters() && !includeReadings() && !includeContracts())}
                class="btn btn-primary"
              >
                <Show when={!isLoading()} fallback={<span class="loading loading-spinner loading-sm"></span>}>
                  Download
                </Show>
              </button>
            </div>
          </div>
        </div>
      </Portal>
    </Show>
  );
};

export default ExportModal;
