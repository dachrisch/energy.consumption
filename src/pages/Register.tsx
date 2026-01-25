import { Component, createSignal } from 'solid-js';
import { useNavigate, A } from '@solidjs/router';

const Register: Component = () => {
  const [name, setName] = createSignal('');
  const [email, setEmail] = createSignal('');
  const [password, setPassword] = createSignal('');
  const navigate = useNavigate();

  const handleRegister = async (e: Event) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name(), email: email(), password: password() }),
      });
      const data = await res.json();
      if (res.ok) {
        alert('Account created! Please sign in.');
        navigate('/login');
      } else {
        alert(data.error || 'Registration failed');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred during registration');
    }
  };

  return (
    <div class="p-6 md:p-10 lg:p-12 flex-1 flex items-center justify-center">
      <div class="w-full max-w-xl">
        <div class="mb-10 text-center">
          <h1 class="text-5xl font-black tracking-tighter">Register</h1>
          <p class="text-base-content/60 font-bold text-lg mt-2">Create your account.</p>
        </div>

        <div class="card bg-base-100 shadow-2xl border border-base-content/5 overflow-hidden w-full">
          <div class="card-body p-8 md:p-12 w-full">
            <form onSubmit={handleRegister} class="space-y-8 w-full">
              <div class="form-control w-full flex flex-col gap-2">
                <label class="px-1">
                  <span class="label-text font-black uppercase text-xs tracking-widest opacity-60">Full Name</span>
                </label>
                <input
                  type="text"
                  placeholder="John Doe"
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
                  Create Account
                </button>
              </div>
            </form>
            
            <div class="divider my-8 opacity-20 w-full">OR</div>
            
            <div class="text-center font-bold">
              <p class="opacity-60 mb-2">Already have an account?</p>
              <A href="/login" class="link link-primary no-underline hover:underline">Sign In</A>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
