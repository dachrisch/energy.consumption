import { Component, createSignal, Show, onMount } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getVersion, getVersionLink, isDevVersion } from '../lib/version';
import PageHeader from '../components/PageHeader';
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
        <span class="label-text text-[11px] font-bold uppercase tracking-wider opacity-50">Full Name</span>
      </label>
      <input
        type="text"
        placeholder="Your Name"
        class="input input-bordered h-12 w-full rounded-xl bg-base-200/50 border border-base-content/10 font-bold text-base focus:ring-2 focus:ring-primary px-4"
        value={props.name}
        onInput={(e) => props.setName(e.currentTarget.value)}
        required
      />
    </div>

    <div class="form-control w-full flex flex-col gap-2">
      <label class="px-1">
        <span class="label-text text-[11px] font-bold uppercase tracking-wider opacity-50">Email Address</span>
      </label>
      <input
        type="email"
        placeholder="email@example.com"
        class="input input-bordered h-12 w-full rounded-xl bg-base-200/50 border border-base-content/10 font-bold text-base focus:ring-2 focus:ring-primary px-4"
        value={props.email}
        onInput={(e) => props.setEmail(e.currentTarget.value)}
        required
      />
    </div>

    <div class="form-control w-full flex flex-col gap-2">
      <label class="px-1">
        <span class="label-text text-[11px] font-bold uppercase tracking-wider opacity-50">New Password (leave blank to keep current)</span>
      </label>
      <input
        type="password"
        placeholder="••••••••"
        class="input input-bordered h-12 w-full rounded-xl bg-base-200/50 border border-base-content/10 font-bold text-base focus:ring-2 focus:ring-primary px-4"
        value={props.password}
        onInput={(e) => props.setPassword(e.currentTarget.value)}
      />
    </div>

    <div class="form-control w-full flex flex-col gap-2">
      <label class="px-1 flex justify-between items-end">
        <span class="label-text text-[11px] font-bold uppercase tracking-wider opacity-50">Google Gemini API Key</span>
        <a href="https://aistudio.google.com/app/apikey" target="_blank" class="text-[10px] font-bold uppercase tracking-wider text-primary hover:underline">Get Key</a>
      </label>
      <input
        type="password"
        placeholder="AIza..."
        class="input input-bordered h-12 w-full rounded-xl bg-base-200/50 border border-base-content/10 font-bold text-base focus:ring-2 focus:ring-primary px-4"
        value={props.googleApiKey}
        onInput={(e) => props.setGoogleApiKey(e.currentTarget.value)}
      />
      <p class="px-1 text-[10px] font-bold opacity-40 uppercase tracking-tight">Enable AI-powered meter scanning. Your key is stored securely.</p>
    </div>

    <div class="form-control mt-6 w-full">
      <button type="submit" class="btn btn-primary btn-lg rounded-xl font-black text-lg h-16 shadow-sm shadow-primary/20 w-full">
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
            <PageHeader
              eyebrow="Account"
              title="Profile settings"
              subtitle="Manage your account identity and security."
            />

            <div class="card bg-base-100 shadow-sm border border-base-content/5 overflow-hidden">
              <div class="card-body p-8 md:p-12">
                <ProfileForm 
                  name={name()} setName={setName}
                  email={email()} setEmail={setEmail}
                  password={password()} setPassword={setPassword}
                  googleApiKey={googleApiKey()} setGoogleApiKey={setGoogleApiKey}
                  onSubmit={handleUpdate}
                />
              </div>
            </div>
          </>
        </Show>
      </Show>
    </div>
  );
};

export default Profile;
