import { ParentComponent } from 'solid-js';
import { Show } from 'solid-js';
import Navigation from './components/Navigation';
import BottomNav from './components/BottomNav';
import { useAuth } from './context/AuthContext';

const App: ParentComponent = (props) => {
  const auth = useAuth();

  return (
    <div class="min-h-screen bg-base-300 flex items-start justify-center p-0 md:p-4 lg:p-8">
      <div class="w-full min-h-screen md:min-h-0 md:h-full max-w-[1400px] bg-base-200 md:rounded-3xl md:shadow-2xl overflow-hidden flex flex-col border border-base-content/5 relative">
        <Show when={auth.user()}>
          <Navigation />
        </Show>
        <main class="flex-1 relative flex flex-col pb-24 lg:pb-0 overflow-x-hidden">
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
