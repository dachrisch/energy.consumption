import { Component, JSX, Show } from 'solid-js';

interface SectionCardProps {
  title?: string;
  hint?: string;
  actions?: JSX.Element;
  children: JSX.Element;
  class?: string;
}

/** Standard content card: title/hint on the left, actions on the right. */
const SectionCard: Component<SectionCardProps> = (props) => (
  <section class={`rounded-3xl border border-base-content/5 bg-base-100 p-5 shadow-sm md:p-7 ${props.class ?? ''}`}>
    <Show when={props.title || props.actions}>
      <header class="flex flex-wrap items-start justify-between gap-3">
        <div class="min-w-0">
          <Show when={props.title}>
            <h2 class="text-base font-black tracking-tight">{props.title}</h2>
          </Show>
          <Show when={props.hint}>
            <p class="mt-0.5 text-xs font-bold opacity-50">{props.hint}</p>
          </Show>
        </div>
        <Show when={props.actions}>
          <div class="flex flex-wrap items-center gap-2">{props.actions}</div>
        </Show>
      </header>
    </Show>
    {props.children}
  </section>
);

export default SectionCard;
