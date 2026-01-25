import { JSX, Show, onMount, createEffect } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute(props: { children: JSX.Element }) {
  const auth = useAuth();
  const navigate = useNavigate();

  createEffect(() => {
    if (!auth.loading() && !auth.user()) {
      navigate('/login', { replace: true });
    }
  });

  return (
    <Show when={!auth.loading()} fallback={
      <div class="flex-1 flex items-center justify-center">
        <span class="loading loading-spinner loading-lg text-primary"></span>
      </div>
    }>
      <Show when={auth.user()}>
        {props.children}
      </Show>
    </Show>
  );
}
