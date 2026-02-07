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

const fetchModalData = async () => {
  const [metersRes, readingsRes, contractsRes] = await Promise.all([
    fetch('/api/meters'),
    fetch('/api/readings'),
    fetch('/api/contracts')
  ]);

  return Promise.all([metersRes.json(), readingsRes.json(), contractsRes.json()]);
};

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

const ExportCheckbox: Component<{
  label: string;
  count: number;
  checked: boolean;
  onChange: (v: boolean) => void;
  countLabel: string;
}> = (props) => (
  <label class="flex items-center gap-3 p-4 rounded-lg border-2 border-base-content/10 cursor-pointer hover:bg-base-200/30 hover:border-base-content/20 transition-all">
    <input
      type="checkbox"
      checked={props.checked}
      onChange={(e) => props.onChange(e.currentTarget.checked)}
      class="checkbox checkbox-primary checkbox-lg"
    />
    <div class="flex-1 min-w-0">
      <div class="font-bold text-base">{props.label}</div>
      <div class="text-xs opacity-60">{props.count} {props.countLabel}{props.count !== 1 ? 's' : ''}</div>
    </div>
  </label>
);

const ExportPreview: Component<{
  includeMeters: boolean;
  includeReadings: boolean;
  includeContracts: boolean;
  meters: Meter[];
  readings: Reading[];
  contracts: Contract[];
}> = (props) => (
  <div class="bg-base-200/50 p-5 rounded-xl mb-6 border border-base-content/10">
    <p class="text-xs font-bold uppercase tracking-widest opacity-60 mb-4">Export Preview</p>
    <div class="space-y-3">
      {/* Meters Preview */}
      <Show when={props.includeMeters}>
        <div class="text-sm space-y-1">
          <p class="font-semibold flex items-center gap-2">
            <span class="text-primary">✓</span>
            Meters ({props.meters.length})
          </p>
          <Show when={props.meters.length > 0}>
            <ul class="ml-6 space-y-1 opacity-70 text-xs">
              <For each={props.meters.slice(0, 3)}>
                {(meter) => <li>• {meter.name}</li>}
              </For>
              <Show when={props.meters.length > 3}>
                <li class="italic">+ {props.meters.length - 3} more...</li>
              </Show>
            </ul>
          </Show>
        </div>
      </Show>

      {/* Readings Preview */}
      <Show when={props.includeReadings}>
        <div class="text-sm space-y-1">
          <p class="font-semibold flex items-center gap-2">
            <span class="text-primary">✓</span>
            Readings ({props.readings.length})
          </p>
          <Show when={props.readings.length > 0}>
            <div class="ml-6 opacity-70 text-xs">
              {formatDateRange(props.readings)}
            </div>
          </Show>
        </div>
      </Show>

      {/* Contracts Preview */}
      <Show when={props.includeContracts}>
        <div class="text-sm space-y-1">
          <p class="font-semibold flex items-center gap-2">
            <span class="text-primary">✓</span>
            Contracts ({props.contracts.length})
          </p>
          <Show when={props.contracts.length > 0}>
            <ul class="ml-6 space-y-1 opacity-70 text-xs">
              <For each={props.contracts.slice(0, 3)}>
                {(contract) => <li>• {contract.providerName}</li>}
              </For>
              <Show when={props.contracts.length > 3}>
                <li class="italic">+ {props.contracts.length - 3} more...</li>
              </Show>
            </ul>
          </Show>
        </div>
      </Show>

      {/* Empty State */}
      <Show when={!props.includeMeters && !props.includeReadings && !props.includeContracts}>
        <p class="text-sm opacity-60 text-center py-2 italic">No data selected for export</p>
      </Show>

      {/* Format Info */}
      <Show when={props.includeMeters || props.includeReadings || props.includeContracts}>
        <div class="pt-2 border-t border-base-content/10 text-xs opacity-60">
          Format: Unified JSON with metadata
        </div>
      </Show>
    </div>
  </div>
);

const handleExportDownload = async (
  options: { includeMeters: boolean; includeReadings: boolean; includeContracts: boolean },
  setIsLoading: (v: boolean) => void,
  onClose: () => void
) => {
  setIsLoading(true);
  try {
    const data = await fetchExportData(options);
    downloadFile(data);
    onClose();
  } catch (error) {
    console.error('Export error:', error);
    alert('Failed to export data. Please try again.');
  } finally {
    setIsLoading(false);
  }
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
      fetchModalData()
        .then(([m, rd, c]) => {
          setMeters(m || []);
          setReadings(rd || []);
          setContracts(c || []);
        })
        .catch((err) => console.error('Failed to fetch data:', err));
    }
  });

  const onDownload = () => handleExportDownload(
    { includeMeters: includeMeters(), includeReadings: includeReadings(), includeContracts: includeContracts() },
    setIsLoading,
    props.onClose
  );

  return (
    <Show when={props.isOpen}>
      <Portal>
        <div class="modal modal-open">
          <div class="modal-box w-11/12 max-w-md">
            <h3 class="font-bold text-lg mb-6">Export Data</h3>

            <div class="space-y-2 mb-8">
              <ExportCheckbox label="Meters" count={props.meterCount} checked={includeMeters()} onChange={setIncludeMeters} countLabel="meter" />
              <ExportCheckbox label="Readings" count={props.readingCount} checked={includeReadings()} onChange={setIncludeReadings} countLabel="reading" />
              <ExportCheckbox label="Contracts" count={props.contractCount} checked={includeContracts()} onChange={setIncludeContracts} countLabel="contract" />
            </div>

            <ExportPreview 
              includeMeters={includeMeters()} includeReadings={includeReadings()} includeContracts={includeContracts()}
              meters={meters()} readings={readings()} contracts={contracts()}
            />

            <div class="modal-action">
              <button onClick={props.onClose} class="btn" disabled={isLoading()}>Cancel</button>
              <button
                onClick={onDownload}
                disabled={isLoading() || (!includeMeters() && !includeReadings() && !includeContracts())}
                class="btn btn-primary"
              >
                <Show when={!isLoading()} fallback={<span class="loading loading-spinner loading-sm"></span>}>Download</Show>
              </button>
            </div>
          </div>
        </div>
      </Portal>
    </Show>
  );
};

export default ExportModal;
