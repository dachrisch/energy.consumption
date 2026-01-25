import { Component, createSignal } from 'solid-js';
import { useNavigate, A } from '@solidjs/router';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const Login: Component = () => {
  const auth = useAuth();
  const [email, setEmail] = createSignal('');
  const [password, setPassword] = createSignal('');
  const navigate = useNavigate();
  const toast = useToast();

  const handleLogin = async (e: Event) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email(), password: password() }),
      });
      const data = await res.json();
      if (res.ok) {
        auth.revalidate();
        toast.showToast('Successfully logged in!', 'success');
        navigate('/dashboard');
      } else {
        toast.showToast(data.error || 'Login failed', 'error');
      }
    } catch (err) {
      console.error(err);
      toast.showToast('An error occurred during login', 'error');
    }
  };

  return (
    <div class="p-6 md:p-10 lg:p-12 flex-1 flex items-center justify-center">
      <div class="w-full max-w-xl">
        <div class="mb-10 text-center">
          <h1 class="text-5xl font-black tracking-tighter">Sign In</h1>
          <p class="text-base-content/60 font-bold text-lg mt-2">Access your energy control center.</p>
        </div>

        <div class="card bg-base-100 shadow-2xl border border-base-content/5 overflow-hidden w-full">
          <div class="card-body p-8 md:p-12 w-full">
            <form onSubmit={handleLogin} class="space-y-8 w-full">
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
                  <span class="label-text font-black uppercase text-xs tracking-widest opacity-60">Password</span>
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  class="input input-bordered h-14 w-full rounded-2xl bg-base-200/50 border-none font-bold text-lg focus:ring-2 focus:ring-primary px-6"
                  value={password()}
                  onInput={(e) => setPassword(e.currentTarget.value)}
                  required
                />
              </div>
              <div class="form-control mt-6 w-full">
                <button type="submit" class="btn btn-primary btn-lg rounded-2xl font-black text-lg h-16 shadow-xl shadow-primary/20 w-full">
                  Sign In
                </button>
              </div>
            </form>
            
            <div class="divider my-8 opacity-20 w-full">OR</div>
            
            <div class="text-center font-bold">
              <p class="opacity-60 mb-2">New user?</p>
              <A href="/register" class="link link-primary no-underline hover:underline">Create Account</A>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
