import type { Component } from 'solid-js';
import Navigation from './components/Navigation';
import BottomNav from './components/BottomNav';

const App: Component = (props: any) => {
  return (
    <div class="h-screen bg-base-300 flex items-center justify-center p-0 md:p-4 lg:p-8 overflow-hidden">
      <div class="w-full h-full max-w-[1400px] bg-base-200 md:rounded-3xl md:shadow-2xl overflow-hidden flex flex-col border border-base-content/5 relative">
        <Navigation />
        <main class="flex-1 overflow-y-auto relative flex flex-col">
          {props.children}
        </main>
        <BottomNav />
      </div>
    </div>
  );
};

export default App;
