import { Component, createSignal, Show, onMount } from 'solid-js';
import { useToast } from '../context/ToastContext';
import { downloadFromUrl } from '../lib/downloadHelper';
import UnifiedImportModal from '../components/UnifiedImportModal';

const ImportExport: Component = () => {
  const toast = useToast();
  const [showImportModal, setShowImportModal] = createSignal(false);
  const [meters, setMeters] = createSignal<any[]>([]);
  const [loading, setLoading] = createSignal(false);

  onMount(() => {
    const fetchMeters = async () => {
      try {
        const res = await fetch('/api/meters');
        if (res.ok) {
          setMeters(await res.json());
        }
      } catch (err) {
        console.error('Failed to fetch meters:', err);
      }
    };
    fetchMeters();
  });

  const handleExportReadings = async () => {
    setLoading(true);
    try {
      await downloadFromUrl('/api/export/readings', `readings-export-${new Date().toISOString().split('T')[0]}.json`);
      toast.showToast('Readings exported successfully', 'success');
    } catch (err) {
      console.error('Export error:', err);
      toast.showToast('Failed to export readings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBackupAll = async () => {
    setLoading(true);
    try {
      await downloadFromUrl('/api/export/all', `backup-${new Date().toISOString().split('T')[0]}.json`);
      toast.showToast('Backup created successfully', 'success');
    } catch (err) {
      console.error('Backup error:', err);
      toast.showToast('Failed to create backup', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleImportReadings = async (readings: any[]) => {
    try {
      const res = await fetch('/api/readings/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(readings)
      });
      const result = await res.json();
      if (res.ok) {
        toast.showToast(`Imported ${result.successCount} readings successfully`, 'success');
        setShowImportModal(false);
      } else {
        toast.showToast(result.error || 'Import failed', 'error');
      }
    } catch (err) {
      console.error('Import error:', err);
      toast.showToast('An error occurred during import', 'error');
    }
  };

  return (
    <div class="p-6 md:p-10 lg:p-12 max-w-4xl mx-auto space-y-10 flex-1">
      <div>
        <h1 class="text-4xl font-black tracking-tighter mb-3">Import / Export</h1>
        <p class="text-base-content/60 font-bold text-lg">Manage your energy consumption data.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Import Section */}
        <div class="card bg-base-100 shadow-2xl border border-base-content/5 overflow-hidden">
          <div class="card-body p-8">
            <div class="flex items-center gap-4 mb-4">
              <div class="bg-primary/10 p-4 rounded-2xl">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
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
              onClick={() => setShowImportModal(true)}
              class="btn btn-primary btn-lg rounded-2xl font-black text-lg h-16 shadow-xl shadow-primary/20 w-full"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
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

        {/* Export Section */}
        <div class="card bg-base-100 shadow-2xl border border-base-content/5 overflow-hidden">
          <div class="card-body p-8">
            <div class="flex items-center gap-4 mb-4">
              <div class="bg-secondary/10 p-4 rounded-2xl">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </div>
              <div>
                <h2 class="text-2xl font-black tracking-tight">Export Data</h2>
                <p class="text-sm opacity-60 font-bold">Download as JSON</p>
              </div>
            </div>
            
            <div class="divider opacity-20 my-4"></div>
            
            <p class="text-sm opacity-70 mb-6">
              Export your readings and data. Choose between exporting all readings or creating a complete backup with meters and contracts.
            </p>

            <div class="space-y-3">
              <button
                onClick={handleExportReadings}
                disabled={loading()}
                class="btn btn-secondary btn-lg rounded-2xl font-black text-lg h-16 shadow-xl shadow-secondary/20 w-full"
              >
                <Show when={!loading()} fallback={<span class="loading loading-spinner loading-sm"></span>}>
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Export Readings
                </Show>
              </button>

              <button
                onClick={handleBackupAll}
                disabled={loading()}
                class="btn btn-accent btn-lg rounded-2xl font-black text-lg h-16 shadow-xl shadow-accent/20 w-full"
              >
                <Show when={!loading()} fallback={<span class="loading loading-spinner loading-sm"></span>}>
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Backup All
                </Show>
              </button>
            </div>

            <div class="text-xs opacity-50 mt-6 p-4 bg-base-200/50 rounded-lg">
              <p class="font-semibold mb-2">Export includes:</p>
              <ul class="space-y-1">
                <li>📥 <strong>Readings:</strong> All meter readings</li>
                <li>💾 <strong>Backup:</strong> Meters, readings + contracts</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div class="card bg-base-100 shadow-2xl border border-base-content/5 overflow-hidden">
        <div class="card-body p-8">
          <h3 class="text-xl font-black tracking-tight mb-4">About Data Management</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 class="font-bold mb-2 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Secure
              </h4>
              <p class="text-sm opacity-70">Your data is isolated per user and encrypted during storage.</p>
            </div>
            <div>
              <h4 class="font-bold mb-2 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l6-6" />
                </svg>
                Flexible
              </h4>
              <p class="text-sm opacity-70">Support for multiple formats: JSON nested, flat, and CSV.</p>
            </div>
            <div>
              <h4 class="font-bold mb-2 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Preview
              </h4>
              <p class="text-sm opacity-70">Always preview before importing to ensure data accuracy.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Import Modal */}
      <UnifiedImportModal
        isOpen={showImportModal()}
        onClose={() => setShowImportModal(false)}
        onSave={handleImportReadings}
        meters={meters()}
      />
    </div>
  );
};

export default ImportExport;
