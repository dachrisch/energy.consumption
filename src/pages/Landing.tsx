import { Show } from 'solid-js';
import { A, Navigate } from '@solidjs/router';
import Icon from '../components/Icon';
import { useAuth } from '../context/AuthContext';

const Landing = () => {
  const auth = useAuth();

  return (
    <Show when={!auth.loading()}>
      <Show when={!auth.user()} fallback={<Navigate href="/dashboard" />}>
        <div class="flex flex-col items-center justify-center p-6 md:p-10 flex-1 max-w-2xl mx-auto text-center">
          <div class="mb-12">
            <div class="bg-primary w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-primary/30 animate-pulse">
              <Icon name="power" class="h-10 w-10 text-primary-content" />
            </div>
            <h1 class="text-6xl font-black tracking-tighter mb-4">EnergyMonitor</h1>
            <p class="text-xl text-base-content/60 font-bold max-w-md mx-auto leading-relaxed">
              The high-performance cockpit for your household energy infrastructure.
            </p>
          </div>

          <div class="card bg-base-100 shadow-2xl border border-base-content/5 w-full">
            <div class="card-body p-10 md:p-12">
              <h2 class="text-2xl font-black uppercase tracking-widest opacity-40 mb-6">Account Access</h2>
              <div class="grid grid-cols-1 gap-4">
                <A href="/login" class="btn btn-primary btn-lg rounded-2xl font-black text-lg h-16 shadow-xl shadow-primary/20">
                  Sign In
                </A>
                <Show when={import.meta.env.VITE_ALLOW_SIGNUP !== 'false'}>
                  <A href="/register" class="btn btn-ghost btn-lg rounded-2xl font-bold opacity-60">
                    Create Account
                  </A>
                </Show>
              </div>
            </div>
          </div>

          <div class="mt-12 opacity-20 font-black tracking-widest text-[10px] uppercase">
            Powered by SolidJS & MongoDB
          </div>
        </div>
      </Show>
    </Show>
  );
};

export default Landing;
