import { Component, JSX, Show } from 'solid-js';

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  subtitle?: string;
  actions?: JSX.Element;
}

/** Consistent page title block: eyebrow, title, subtitle and right-side actions. */
const PageHeader: Component<PageHeaderProps> = (props) => (
  <header class="mb-6 flex flex-wrap items-end justify-between gap-4 md:mb-8">
    <div class="min-w-0">
      <p class="text-[10px] font-black uppercase tracking-[0.2em] text-primary">{props.eyebrow}</p>
      <h1 class="mt-1 text-3xl font-black tracking-tighter md:text-4xl">{props.title}</h1>
      <Show when={props.subtitle}>
        <p class="mt-1 max-w-2xl text-sm font-bold opacity-50">{props.subtitle}</p>
      </Show>
    </div>
    <Show when={props.actions}>
      <div class="flex flex-wrap items-center gap-2">{props.actions}</div>
    </Show>
  </header>
);

export default PageHeader;
