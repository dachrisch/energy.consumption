import { Component, createSignal, Show, onMount } from 'solid-js';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const Profile: Component = () => {
  const auth = useAuth();
  const [name, setName] = createSignal('');
  const [email, setEmail] = createSignal('');
  const [password, setPassword] = createSignal('');
  const [googleApiKey, setGoogleApiKey] = createSignal('');
  const toast = useToast();

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
                </form>
              </div>
            </div>
          </>
        </Show>
      </Show>
    </div>
  );
};

export default Profile;
