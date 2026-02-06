import { Component, createSignal, Show, onMount } from 'solid-js';
import { useNavigate, useSearchParams } from '@solidjs/router';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getVersion, getVersionLink, isDevVersion } from '../lib/version';
import { downloadFromUrl } from '../lib/downloadHelper';
import UnifiedImportModal from '../components/UnifiedImportModal';

const Profile: Component = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const [name, setName] = createSignal('');
  const [email, setEmail] = createSignal('');
  const [password, setPassword] = createSignal('');
  const [googleApiKey, setGoogleApiKey] = createSignal('');
  const [showImportModal, setShowImportModal] = createSignal(false);
  const [meters, setMeters] = createSignal<any[]>([]);

  onMount(() => {
    const user = auth.user();
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setGoogleApiKey(user.googleApiKey || '');
    }
    
    // Fetch meters for import modal
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
    
    // Show import/export tab if requested
    if (searchParams.tab === 'import-export') {
      setShowImportModal(true);
    }
  });

  const handleUpdate = async (e: Event) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name(),
          email: email(),
          password: password() || undefined,
          googleApiKey: googleApiKey()
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.showToast('Profile updated successfully!', 'success');
        auth.revalidate();
        setPassword('');
        setTimeout(() => navigate(-1), 500);
      } else {
        toast.showToast(data.error || 'Update failed', 'error');
      }
    } catch (err) {
      console.error(err);
      toast.showToast('An error occurred during update', 'error');
    }
  };

  const handleExportReadings = async () => {
    try {
      await downloadFromUrl('/api/export/readings', `readings-export-${new Date().toISOString().split('T')[0]}.json`);
      toast.showToast('Readings exported successfully', 'success');
    } catch (err) {
      console.error('Export error:', err);
      toast.showToast('Failed to export readings', 'error');
    }
  };

  const handleBackupAll = async () => {
    try {
      await downloadFromUrl('/api/export/all', `backup-${new Date().toISOString().split('T')[0]}.json`);
      toast.showToast('Backup created successfully', 'success');
    } catch (err) {
      console.error('Backup error:', err);
      toast.showToast('Failed to create backup', 'error');
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
    <div class="p-6 md:p-10 lg:p-12 max-w-2xl mx-auto flex-1 flex flex-col justify-center">
      <Show when={!auth.loading()} fallback={<div class="flex justify-center py-20"><span class="loading loading-spinner loading-lg text-primary"></span></div>}>
        <Show when={auth.user()}>
          <>
            <div class="mb-10">
              <h1 class="text-4xl font-black tracking-tighter">Profile Settings</h1>
              <p class="text-base-content/60 font-bold text-lg mt-2">Manage your account identity and security.</p>
            </div>

            <div class="card bg-base-100 shadow-2xl border border-base-content/5 overflow-hidden">
              <div class="card-body p-8 md:p-12">
                <form onSubmit={handleUpdate} class="space-y-8 w-full">
                  <div class="form-control w-full flex flex-col gap-2">
                    <label class="px-1">
                      <span class="label-text font-black uppercase text-xs tracking-widest opacity-60">Full Name</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Your Name"
                      class="input input-bordered h-14 w-full rounded-2xl bg-base-200/50 border-none font-bold text-lg focus:ring-2 focus:ring-primary px-6"
                      value={name()}
                      onInput={(e) => setName(e.currentTarget.value)}
                      required
                    />
                  </div>

                  <div class="form-control w-full flex flex-col gap-2">
                    <label class="px-1">
                      <span class="label-text font-black uppercase text-xs tracking-widest opacity-60">Email Address</span>
                    </label>
                    <input
                      type="email"
                      placeholder="email@example.com"
                      class="input input-bordered h-14 w-full rounded-2xl bg-base-200/50 border-none font-bold text-lg focus:ring-2 focus:ring-primary px-6"
                      value={email()}
                      onInput={(e) => setEmail(e.currentTarget.value)}
                      required
                    />
                  </div>

                  <div class="form-control w-full flex flex-col gap-2">
                    <label class="px-1">
                      <span class="label-text font-black uppercase text-xs tracking-widest opacity-60">New Password (leave blank to keep current)</span>
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      class="input input-bordered h-14 w-full rounded-2xl bg-base-200/50 border-none font-bold text-lg focus:ring-2 focus:ring-primary px-6"
                      value={password()}
                      onInput={(e) => setPassword(e.currentTarget.value)}
                    />
                  </div>

                  <div class="form-control w-full flex flex-col gap-2">
                    <label class="px-1 flex justify-between items-end">
                      <span class="label-text font-black uppercase text-xs tracking-widest opacity-60">Google Gemini API Key</span>
                      <a href="https://aistudio.google.com/app/apikey" target="_blank" class="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">Get Key</a>
                    </label>
                    <input
                      type="password"
                      placeholder="AIza..."
                      class="input input-bordered h-14 w-full rounded-2xl bg-base-200/50 border-none font-bold text-lg focus:ring-2 focus:ring-primary px-6"
                      value={googleApiKey()}
                      onInput={(e) => setGoogleApiKey(e.currentTarget.value)}
                    />
                    <p class="px-1 text-[10px] font-bold opacity-40 uppercase tracking-tight">Enable AI-powered meter scanning. Your key is stored securely.</p>
                  </div>

                  <div class="form-control mt-6 w-full">
                    <button type="submit" class="btn btn-primary btn-lg rounded-2xl font-black text-lg h-16 shadow-xl shadow-primary/20 w-full">
                      Update Account
                    </button>
                  </div>

                   <div class="divider my-8 opacity-30"></div>
                   
                   <div class="space-y-6">
                     <div>
                       <h3 class="text-lg font-black tracking-tight mb-4">Data Management</h3>
                       <p class="text-sm opacity-60 mb-4">Import and export your energy consumption data in JSON format.</p>
                       <div class="flex flex-col sm:flex-row gap-3">
                         <button 
                           onClick={() => setShowImportModal(true)}
                           class="btn btn-outline btn-sm rounded-xl font-black text-xs uppercase tracking-widest flex-1"
                         >
                           <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
                           Import Data
                         </button>
                         <button 
                           onClick={handleExportReadings}
                           class="btn btn-outline btn-sm rounded-xl font-black text-xs uppercase tracking-widest flex-1"
                         >
                           <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                           Export Readings
                         </button>
                         <button 
                           onClick={handleBackupAll}
                           class="btn btn-outline btn-sm rounded-xl font-black text-xs uppercase tracking-widest flex-1"
                         >
                           <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                           Backup All
                         </button>
                       </div>
                     </div>
                   </div>

                   <div class="divider my-8 opacity-30"></div>
                   <div class="text-center">
                     <a
                       href={getVersionLink()}
                       target="_blank"
                       rel="noopener noreferrer"
                       class="text-[11px] font-mono opacity-40 hover:opacity-100 hover:text-primary transition-all inline-flex items-center gap-2"
                     >
                       <Show when={!isDevVersion()} fallback={<span>dev</span>}>
                         <span>{getVersion()}</span>
                         <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                         </svg>
                       </Show>
                     </a>
                   </div>
                </form>
              </div>
            </div>
          </>
        </Show>
      </Show>
      
      <UnifiedImportModal
        isOpen={showImportModal()}
        onClose={() => setShowImportModal(false)}
        onSave={handleImportReadings}
        meters={meters()}
      />
    </div>
  );
};

export default Profile;
