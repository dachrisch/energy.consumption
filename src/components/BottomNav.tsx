import { Component, For, Show } from 'solid-js';
import { A } from '@solidjs/router';
import Icon from './Icon';

const BottomNav: Component = () => {
  const navItems = [
    { 
      name: 'Dashboard', 
      path: '/dashboard', 
      icon: <Icon name="dashboard" class="h-6 w-6" /> 
    },
    { 
      name: 'Add Reading', 
      path: '/add-reading', 
      icon: <Icon name="add" class="h-8 w-8" />,
      prominent: true
    },
    { 
      name: 'Meters', 
      path: '/meters', 
      icon: <Icon name="meter" class="h-6 w-6" />
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
                  <div class="h-1 w-1 rounded-full bg-current mt-1 opacity-0 transition-opacity" />
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
