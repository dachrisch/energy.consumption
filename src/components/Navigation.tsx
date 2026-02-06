import { Component, For, Show } from 'solid-js';
import { A } from '@solidjs/router';
import { useAuth } from '../context/AuthContext';
import { getVersion, getVersionLink } from '../lib/version';

const NavBrand: Component = () => (
  <div class="navbar-start">
    <A href="/dashboard" class="flex items-center gap-3 group active:scale-95 transition-all">
      <div class="bg-primary p-2.5 rounded-2xl text-primary-content shadow-lg shadow-primary/20 group-hover:rotate-12 transition-all duration-300">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div>
      <span class="text-2xl font-black tracking-tighter hidden sm:block text-base-content">EnergyMonitor</span>
    </A>
  </div>
);

const NavMenu: Component<{ items: { name: string, path: string }[] }> = (props) => (
  <div class="navbar-center hidden lg:flex">
    <ul class="menu menu-horizontal px-1 gap-1 p-1 bg-base-200 rounded-2xl border border-base-content/5">
      <For each={props.items}>
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
);

const UserDropdown: Component<{ auth: ReturnType<typeof useAuth>, closeDropdown: () => void }> = (props) => (
  <div class="navbar-end gap-4">
    <div class="dropdown dropdown-end">
      <label tabindex="0" class="btn btn-ghost p-1 h-14 rounded-2xl hover:bg-primary/5 group transition-all border border-base-content/5">
        <div class="flex items-center gap-3 px-3">
          <div class="hidden md:block text-right">
            <p class="text-xs font-black tracking-tight leading-none mb-1 text-base-content">
              <Show when={!props.auth.loading()} fallback="Loading...">
                {props.auth.user()?.name || 'User'}
              </Show>
            </p>
            <p class="text-[9px] uppercase tracking-widest opacity-40 font-black">Operator</p>
          </div>
          <div class="w-10 h-10 rounded-xl bg-primary text-primary-content flex items-center justify-center font-black text-sm shadow-md shadow-primary/20 group-hover:scale-110 transition-all">
            {props.auth.user()?.name?.substring(0, 2).toUpperCase() || 'U'}
          </div>
        </div>
      </label>
       <ul tabindex="0" class="mt-4 z-[100] p-3 shadow-2xl menu menu-sm dropdown-content bg-base-100 rounded-2xl w-64 border border-base-content/10 animate-in fade-in slide-in-from-top-2 opacity-100 visible">
         <div class="px-4 py-4 mb-2 border-b border-base-content/5 bg-base-200 rounded-xl">
           <p class="text-sm font-black tracking-tight text-base-content">{props.auth.user()?.name || 'Operator'}</p>
           <p class="text-xs opacity-40 font-bold text-base-content">{props.auth.user()?.email || 'N/A'}</p>
         </div>
         <li><A href="/profile" onClick={props.closeDropdown} class="rounded-lg font-black uppercase text-[10px] tracking-widest py-3 hover:bg-primary/5 hover:text-primary text-base-content">Profile Settings</A></li>
         <li><A href="/import-export" onClick={props.closeDropdown} class="rounded-lg font-black uppercase text-[10px] tracking-widest py-3 hover:bg-primary/5 hover:text-primary text-base-content">Import / Export</A></li>
         <li>
           <a
             href={getVersionLink()}
             target="_blank"
             rel="noopener noreferrer"
             onClick={props.closeDropdown}
             class="rounded-lg font-mono text-[11px] py-3 hover:bg-primary/5 hover:text-primary text-base-content/50"
           >
             {getVersion()}
           </a>
         </li>
         <div class="divider my-1 opacity-50"></div>
         <li><button onClick={() => { props.closeDropdown(); props.auth.logout(); }} class="text-error font-black uppercase text-[10px] tracking-widest py-3 hover:bg-error/10">Logout</button></li>
       </ul>
    </div>
  </div>
);

const Navigation: Component = () => {
  const auth = useAuth();

  const closeDropdown = () => {
    const elem = document.activeElement as HTMLElement;
    elem?.blur();
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Meters', path: '/meters' },
    { name: 'Contracts', path: '/contracts' },
  ];

  return (
    <div class="navbar bg-base-100 border-b border-base-content/10 px-4 md:px-10 h-24 shrink-0 z-50 shadow-sm relative">
      <NavBrand />
      <NavMenu items={navItems} />
      <UserDropdown auth={auth} closeDropdown={closeDropdown} />
    </div>
  );
};

export default Navigation;
