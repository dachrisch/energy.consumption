import { createContext, useContext, createSignal, For, Show, JSX } from 'solid-js';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, action?: { label: string; onClick: () => void }) => void;
  confirm: (message: string) => Promise<boolean>;
}

const ToastContext = createContext<ToastContextType>();

export const ToastProvider = (props: { children: JSX.Element }) => {
  const [toasts, setToasts] = createSignal<Toast[]>([]);
  const [confirmState, setConfirmState] = createSignal<{ message: string; resolve: (val: boolean) => void } | null>(null);
  let nextId = 0;

  const showToast = (message: string, type: ToastType = 'info', action?: { label: string; onClick: () => void }) => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, message, type, action }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  const confirm = (message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmState({ message, resolve });
    });
  };

  const handleConfirm = (value: boolean) => {
    const state = confirmState();
    if (state) {
      state.resolve(value);
      setConfirmState(null);
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, confirm }}>
      {props.children}
      
      {/* Toast Container */}
      <div class="toast toast-end toast-bottom z-[1000] p-6">
        <For each={toasts()}>
          {(toast) => (
            <div class={`alert alert-${toast.type} shadow-2xl rounded-2xl border-none font-black text-sm animate-in slide-in-from-right-10 duration-300 flex justify-between gap-4`}>
              <div class="flex items-center gap-3">
                <Show when={toast.type === 'success'}>
                  <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0112 0z" /></svg>
                </Show>
                <Show when={toast.type === 'error'}>
                  <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0112 0z" /></svg>
                </Show>
                <span>{toast.message}</span>
              </div>
              <Show when={toast.action}>
                <button 
                  class="btn btn-xs btn-ghost bg-white/20 hover:bg-white/30 text-current border-none rounded-lg px-3"
                  onClick={() => {
                    toast.action?.onClick();
                    setToasts((prev) => prev.filter((t) => t.id !== toast.id));
                  }}
                >
                  {toast.action?.label}
                </button>
              </Show>
            </div>
          )}
        </For>
      </div>

      {/* Confirmation Modal */}
      <Show when={confirmState()}>
        <div class="modal modal-open modal-bottom sm:modal-middle backdrop-blur-sm transition-all duration-300">
          <div class="modal-box bg-base-100 rounded-3xl border border-base-content/5 shadow-2xl p-8 animate-in zoom-in-95 duration-200">
            <h3 class="text-2xl font-black tracking-tighter mb-4">Are you sure?</h3>
            <p class="text-base-content/60 font-bold mb-8 text-lg leading-relaxed">{confirmState()?.message}</p>
            <div class="modal-action flex gap-3">
              <button class="btn btn-ghost flex-1 rounded-2xl font-bold" onClick={() => handleConfirm(false)}>Cancel</button>
              <button class="btn btn-error flex-[2] rounded-2xl font-black shadow-xl shadow-error/20" onClick={() => handleConfirm(true)}>Confirm</button>
            </div>
          </div>
          <div class="modal-backdrop bg-base-content/20" onClick={() => handleConfirm(false)}></div>
        </div>
      </Show>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {throw new Error('useToast must be used within a ToastProvider');}
  return context;
};
