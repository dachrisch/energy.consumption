import { Component, createSignal, Show, onMount } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getVersion, getVersionLink, isDevVersion } from '../lib/version';
import Icon from '../components/Icon';

interface ProfileFormProps {
  name: string;
  setName: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  googleApiKey: string;
  setGoogleApiKey: (v: string) => void;
  onSubmit: (e: Event) => void;
}

const ProfileForm: Component<ProfileFormProps> = (props) => (
  <form onSubmit={props.onSubmit} class="space-y-8 w-full">
    <div class="form-control w-full flex flex-col gap-2">
      <label class="px-1">
        <span class="label-text font-black uppercase text-xs tracking-widest opacity-60">Full Name</span>
      </label>
      <input
        type="text"
        placeholder="Your Name"
        class="input input-bordered h-14 w-full rounded-2xl bg-base-200/50 border-none font-bold text-lg focus:ring-2 focus:ring-primary px-6"
        value={props.name}
        onInput={(e) => props.setName(e.currentTarget.value)}
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
        value={props.email}
        onInput={(e) => props.setEmail(e.currentTarget.value)}
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
        value={props.password}
        onInput={(e) => props.setPassword(e.currentTarget.value)}
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
        value={props.googleApiKey}
        onInput={(e) => props.setGoogleApiKey(e.currentTarget.value)}
      />
      <p class="px-1 text-[10px] font-bold opacity-40 uppercase tracking-tight">Enable AI-powered meter scanning. Your key is stored securely.</p>
    </div>

    <div class="form-control mt-6 w-full">
      <button type="submit" class="btn btn-primary btn-lg rounded-2xl font-black text-lg h-16 shadow-xl shadow-primary/20 w-full">
        Update Account
      </button>
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
           <Icon name="external-link" class="h-3 w-3" />
         </Show>
       </a>
     </div>
  </form>
);

const Profile: Component = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [name, setName] = createSignal('');
  const [email, setEmail] = createSignal('');
  const [password, setPassword] = createSignal('');
  const [googleApiKey, setGoogleApiKey] = createSignal('');

  onMount(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get('google') === 'connected') {
      toast.showToast('Google connected successfully!', 'success');
      url.searchParams.delete('google');
      window.history.replaceState({}, '', url.toString());
    }
  });

  onMount(() => {
    const user = auth.user();
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setGoogleApiKey(user.googleApiKey || '');
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
                <ProfileForm 
                  name={name()} setName={setName}
                  email={email()} setEmail={setEmail}
                  password={password()} setPassword={setPassword}
                  googleApiKey={googleApiKey()} setGoogleApiKey={setGoogleApiKey}
                  onSubmit={handleUpdate}
                />
                {/* Google Account Link — in-app connect via redirect */}
                <div class="mt-6 bg-base-200 rounded-3xl p-6 border border-base-content/5">
                  <div class="text-sm font-bold mb-2">Google Connectivity</div>
                  {/* rel="external" keeps @solidjs/router from intercepting these:
                      they are API redirects, not client-side routes. */}
                  <Show when={!auth.user()?.google}>
                    <p class="text-sm opacity-60 mb-4 font-bold">Link your Google account to pull provider bills and archive them to Drive.</p>
                    <a href="/api/google/connect" rel="external" class="btn btn-primary btn-md rounded-2xl font-black text-base shadow-xl shadow-primary/20 w-full md:w-auto"><Icon name="google" class="h-5 w-5 mr-2" /> Connect Google</a>
                  </Show>
                  <Show when={auth.user()?.google?.status === 'reconnect_required'}>
                    <p class="text-sm font-bold text-warning mb-2">⚠ Google authorization expired</p>
                    <p class="text-xs opacity-50 mb-3">The refresh token is no longer valid. Click to reconnect.</p>
                    <a href="/api/google/connect" rel="external" class="btn btn-warning btn-sm rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-warning/20"><Icon name="refresh" class="h-4 w-4 mr-1" /> Reconnect Google</a>
                  </Show>
                  <Show when={auth.user()?.google && auth.user()?.google?.status !== 'reconnect_required'}>
                    <p class="text-sm font-bold text-success mb-2">✓ Google connected</p>
                    <p class="text-xs opacity-50 mb-3">Intake from Gmail + archive to Drive is active.</p>
                    <a href="/api/google/connect" rel="external" class="btn btn-ghost btn-sm rounded-xl font-black text-xs uppercase tracking-widest text-base-content/60 hover:text-primary"><Icon name="refresh" class="h-3 w-3 mr-1" /> Reconnect</a>
                  </Show>
                </div>
              </div>
            </div>
          </>
        </Show>
      </Show>
    </div>
  );
};

export default Profile;
