import { Component, For, Show } from 'solid-js';
import { A, useLocation } from '@solidjs/router';
import { useAuth } from '../context/AuthContext';

const Navigation: Component = () => {
  const location = useLocation();
  const auth = useAuth();
  const isAuthPage = () => ['/', '/login', '/register'].includes(location.pathname);

  const navItems = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Meters', path: '/dashboard' },
    { name: 'Contracts', path: '/contracts' },
  ];

  if (isAuthPage()) return null;

  return (
    <div class="navbar bg-base-100/50 backdrop-blur-xl border-b border-base-content/5 px-4 md:px-10 h-24 shrink-0 z-50">
      <div class="navbar-start">
        <A href="/dashboard" class="flex items-center gap-3 group active:scale-95 transition-all">
          <div class="bg-primary p-2.5 rounded-2xl text-primary-content shadow-2xl shadow-primary/30 group-hover:rotate-12 transition-all duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span class="text-2xl font-black tracking-tighter hidden sm:block bg-gradient-to-br from-base-content to-base-content/60 bg-clip-text text-transparent">EnergyMonitor</span>
        </A>
      </div>

      <div class="navbar-center hidden lg:flex">
        <ul class="menu menu-horizontal px-1 gap-1 p-1 bg-base-200/50 rounded-2xl border border-base-content/5">
          <For each={navItems}>
            {(item) => (
              <li>
                <A 
                  href={item.path} 
                  class="font-black text-[11px] uppercase tracking-[0.15em] rounded-xl hover:bg-base-100 hover:text-primary transition-all px-6 py-3"
                  activeClass="bg-base-100 text-primary shadow-sm"
                >
                  {item.name}
                </A>
              </li>
            )}
          </For>
        </ul>
      </div>

      <div class="navbar-end gap-4">
        <div class="dropdown dropdown-end">
          <label tabindex="0" class="btn btn-ghost p-1 h-14 rounded-2xl hover:bg-primary/5 group transition-all">
            <div class="flex items-center gap-3 px-3">
              <div class="hidden md:block text-right">
                <p class="text-xs font-black tracking-tight leading-none mb-1">
                  <Show when={!auth.loading()} fallback="Loading...">
                    {auth.user()?.name || 'User'}
                  </Show>
                </p>
                <p class="text-[9px] uppercase tracking-widest opacity-40 font-black">Operator</p>
              </div>
              <div class="w-10 h-10 rounded-xl bg-primary text-primary-content flex items-center justify-center font-black text-sm shadow-xl shadow-primary/20 group-hover:scale-110 transition-all">
                {auth.user()?.name?.substring(0, 2).toUpperCase() || 'U'}
              </div>
            </div>
          </label>
          <ul tabindex="0" class="mt-4 z-[100] p-3 shadow-2xl menu menu-sm dropdown-content bg-base-100 rounded-2xl w-64 border border-base-content/10 animate-in fade-in slide-in-from-top-2">
            <div class="px-4 py-4 mb-2 border-b border-base-content/5 bg-base-200/30 rounded-xl">
              <p class="text-sm font-black tracking-tight">{auth.user()?.name || 'Operator'}</p>
              <p class="text-xs opacity-40 font-bold">{auth.user()?.email || 'N/A'}</p>
            </div>
            <li><A href="/profile" class="rounded-lg font-black uppercase text-[10px] tracking-widest py-3 hover:bg-primary/5 hover:text-primary">Profile Settings</A></li>
            <div class="divider my-1 opacity-50"></div>
            <li><button onClick={() => auth.logout()} class="text-error font-black uppercase text-[10px] tracking-widest py-3 hover:bg-error/10">Logout</button></li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Navigation;