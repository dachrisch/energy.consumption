import { Component, createSignal, onMount } from 'solid-js';
import { useToast } from '../context/ToastContext';
import UnifiedImportModal from '../components/UnifiedImportModal';
import ExportModal from '../components/ExportModal';
import Icon from '../components/Icon';

const ImportCard: Component<{ onImport: () => void }> = (props) => (
  <div class="card bg-base-100 shadow-2xl border border-base-content/5 overflow-hidden">
    <div class="card-body p-8">
      <div class="flex items-center gap-4 mb-4">
        <div class="bg-primary/10 p-4 rounded-2xl">
          <Icon name="import" class="h-8 w-8 text-primary" />
        </div>
        <div>
          <h2 class="text-2xl font-black tracking-tight">Import Data</h2>
          <p class="text-sm opacity-60 font-bold">JSON or CSV files</p>
        </div>
      </div>
      
      <div class="divider opacity-20 my-4"></div>
      
      <p class="text-sm opacity-70 mb-6">
        Import your energy consumption readings from JSON or CSV files. Supports nested JSON format from exports, flat JSON format, and standard CSV files.
      </p>

      <button
        onClick={props.onImport}
        class="btn btn-primary btn-lg rounded-2xl font-black text-lg h-16 shadow-xl shadow-primary/20 w-full"
      >
        <Icon name="add" class="h-6 w-6" />
        Import Data
      </button>

      <div class="text-xs opacity-50 mt-6 p-4 bg-base-200/50 rounded-lg">
        <p class="font-semibold mb-2">Supported formats:</p>
        <ul class="space-y-1">
          <li>• JSON (nested): from exports</li>
          <li>• JSON (flat): meterId, date, value</li>
          <li>• CSV/TSV: with date and value columns</li>
        </ul>
      </div>
    </div>
  </div>
);

const ExportCard: Component<{ onExport: () => void }> = (props) => (
  <div class="card bg-base-100 shadow-2xl border border-base-content/5 overflow-hidden">
    <div class="card-body p-8">
      <div class="flex items-center gap-4 mb-4">
        <div class="bg-secondary/10 p-4 rounded-2xl">
          <Icon name="export" class="h-8 w-8 text-secondary" />
        </div>
        <div>
          <h2 class="text-2xl font-black tracking-tight">Export Data</h2>
          <p class="text-sm opacity-60 font-bold">Download as JSON</p>
        </div>
      </div>
      
      <div class="divider opacity-20 my-4"></div>
      
      <p class="text-sm opacity-70 mb-6">
        Choose what to export: meters, readings, and/or contracts. Always includes metadata for easy import.
      </p>

      <button
        onClick={props.onExport}
        class="btn btn-secondary btn-lg rounded-2xl font-black text-lg h-16 shadow-xl shadow-secondary/20 w-full"
      >
        <Icon name="export" class="h-6 w-6" />
        Export Data
      </button>

      <div class="text-xs opacity-50 mt-6 p-4 bg-base-200/50 rounded-lg">
        <p class="font-semibold mb-2">Export format:</p>
        <ul class="space-y-1">
          <li>✓ Unified JSON with metadata</li>
          <li>✓ Compatible with import function</li>
          <li>✓ Includes export date and version</li>
        </ul>
      </div>
    </div>
  </div>
);

const DataManagementInfo: Component = () => (
  <div class="card bg-base-100 shadow-2xl border border-base-content/5 overflow-hidden">
    <div class="card-body p-8">
      <h3 class="text-xl font-black tracking-tight mb-4">About Data Management</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <h4 class="font-bold mb-2 flex items-center gap-2">
            <Icon name="history" class="h-5 w-5 text-primary" />
            Secure
          </h4>
          <p class="text-sm opacity-70">Your data is isolated per user and encrypted during storage.</p>
        </div>
        <div>
          <h4 class="font-bold mb-2 flex items-center gap-2">
            <Icon name="export" class="h-5 w-5 text-secondary" />
            Unified Format
          </h4>
          <p class="text-sm opacity-70">All exports use a consistent JSON format for seamless imports.</p>
        </div>
        <div>
          <h4 class="font-bold mb-2 flex items-center gap-2">
            <Icon name="history" class="h-5 w-5 text-accent" />
            Preview
          </h4>
          <p class="text-sm opacity-70">Always preview before importing to ensure data accuracy.</p>
        </div>
      </div>
    </div>
  </div>
);

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

const fetchImportExportData = async (
  setMeters: (v: Meter[]) => void,
  setReadings: (v: Reading[]) => void,
  setContracts: (v: Contract[]) => void
) => {
  try {
    const [metersRes, readingsRes, contractsRes] = await Promise.all([
      fetch('/api/meters'),
      fetch('/api/readings'),
      fetch('/api/contracts')
    ]);
    
    if (metersRes.ok) {
      setMeters(await metersRes.json());
    }
    if (readingsRes.ok) {
      setReadings(await readingsRes.json());
    }
    if (contractsRes.ok) {
      setContracts(await contractsRes.json());
    }
  } catch (err) {
    console.error('Failed to fetch data:', err);
  }
};

const handleDataImport = async (
  data: unknown,
  toast: { showToast: (msg: string, type: string) => void },
  setShowImportModal: (v: boolean) => void,
  onSuccess: () => void
) => {
  const isUnifiedBackup = (d: unknown): boolean => {
    return (
      typeof d === 'object' &&
      d !== null &&
      !Array.isArray(d) &&
      'version' in d &&
      (d as { version?: string }).version === '1.0' &&
      'data' in d
    );
  };

  try {
    const isUnified = isUnifiedBackup(data);
    const endpoint = isUnified ? '/api/import/unified' : '/api/readings/bulk';

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (res.ok) {
      if (isUnified) {
        toast.showToast(`Backup restored: ${result.metersCreated} meters, ${result.successCount} readings, ${result.contractsCreated} contracts.`, 'success');
      } else {
        toast.showToast(`Imported ${result.successCount} readings successfully`, 'success');
      }
      setShowImportModal(false);
      onSuccess();
    } else {
      toast.showToast(result.error || 'Import failed', 'error');
    }
  } catch (err) {
    console.error('Import error:', err);
    toast.showToast('An error occurred during import', 'error');
  }
};

const ImportExport: Component = () => {
  const toast = useToast();
  const [showImportModal, setShowImportModal] = createSignal(false);
  const [showExportModal, setShowExportModal] = createSignal(false);
  
  const [meters, setMeters] = createSignal<Meter[]>([]);
  const [readings, setReadings] = createSignal<Reading[]>([]);
  const [contracts, setContracts] = createSignal<Contract[]>([]);

  const refreshData = () => fetchImportExportData(setMeters, setReadings, setContracts);

  onMount(() => refreshData());

  const onSaveImport = (data: unknown) => handleDataImport(data, toast, setShowImportModal, refreshData);

  return (
    <div class="p-6 md:p-10 lg:p-12 max-w-4xl mx-auto space-y-10 flex-1">
      <div>
        <h1 class="text-4xl font-black tracking-tighter mb-3">Import / Export</h1>
        <p class="text-base-content/60 font-bold text-lg">Manage your energy consumption data.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <ImportCard onImport={() => setShowImportModal(true)} />
        <ExportCard onExport={() => setShowExportModal(true)} />
      </div>

      <DataManagementInfo />

      {/* Import Modal */}
      <UnifiedImportModal
        isOpen={showImportModal()}
        onClose={() => setShowImportModal(false)}
        onSave={onSaveImport}
        meters={meters()}
        onMeterCreated={(m) => setMeters([...meters(), m])}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal()}
        onClose={() => setShowExportModal(false)}
        meterCount={meters().length}
        readingCount={readings().length}
        contractCount={contracts().length}
        meters={meters()}
        readings={readings()}
        contracts={contracts()}
      />
    </div>
  );
};

export default ImportExport;
