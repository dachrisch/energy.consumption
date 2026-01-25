import { Component, For, Show } from 'solid-js';
import { A } from '@solidjs/router';

const BottomNav: Component = () => {
  const navItems = [
    { 
      name: 'Dashboard', 
      path: '/dashboard', 
      icon: <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> 
    },
    { 
      name: 'Add Reading', 
      path: '/add-reading', 
      icon: <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 4v16m8-8H4" /></svg>,
      prominent: true
    },
    { 
      name: 'Meters', 
      path: '/meters', 
      icon: <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
    }
  ];

  return (
    <div class="btm-nav fixed bottom-0 left-0 right-0 lg:hidden border-t border-base-content/5 bg-base-100/95 backdrop-blur-xl pb-safe z-50 h-20 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
      <div class="flex items-center justify-around h-full w-full max-w-lg mx-auto px-2">
        <For each={navItems}>
          {(item) => (
            <A 
              href={item.path} 
              activeClass={!item.prominent ? "text-primary" : ""}
              class={`flex flex-col items-center justify-center w-20 transition-all duration-200 ${item.prominent ? 'relative -top-6' : 'h-full opacity-60 hover:opacity-100 active:scale-95'}`}
            >
              <Show when={item.prominent} fallback={
                <>
                  {item.icon}
                  <span class="text-[10px] font-black uppercase tracking-tighter mt-1">{item.name}</span>
                  {/* Active Indicator Dot */}
                  <div class="h-1 w-1 rounded-full bg-current mt-1 opacity-0 transition-opacity" classList={{ 'opacity-100': false /* This will be handled by activeClass logic if we were using it for the dot, but simplicity first */ }} />
                </>
              }>
                {/* Prominent FAB */}
                <div class="bg-primary text-primary-content h-16 w-16 rounded-full flex flex-col items-center justify-center shadow-lg shadow-primary/40 ring-4 ring-base-100 active:scale-90 transition-transform">
                   {item.icon}
                </div>
                <span class="text-[10px] font-black uppercase tracking-tighter text-primary mt-2 shadow-sm">{item.name}</span>
              </Show>
            </A>
          )}
        </For>
      </div>
    </div>
  );
};

export default BottomNav;