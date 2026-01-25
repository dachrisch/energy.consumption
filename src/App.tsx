import type { Component } from 'solid-js';
import { Show } from 'solid-js';
import Navigation from './components/Navigation';
import BottomNav from './components/BottomNav';
import { useAuth } from './context/AuthContext';

const App: Component = (props: any) => {
  const auth = useAuth();

  return (
    <div class="h-screen bg-base-300 flex items-center justify-center p-0 md:p-4 lg:p-8 overflow-hidden">
      <div class="w-full h-full max-w-[1400px] bg-base-200 md:rounded-3xl md:shadow-2xl overflow-hidden flex flex-col border border-base-content/5 relative">
        <Show when={auth.user()}>
          <Navigation />
        </Show>
        <main class="flex-1 overflow-y-auto relative flex flex-col">
          {props.children}
        </main>
        <Show when={auth.user()}>
          <BottomNav />
        </Show>
      </div>
    </div>
  );
};

export default App;
