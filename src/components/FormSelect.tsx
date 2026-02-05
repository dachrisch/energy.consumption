import { Component, JSX, splitProps, For } from 'solid-js';

interface FormSelectProps extends JSX.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: Array<{ value: string; label: string }>;
  containerClass?: string;
  labelClass?: string;
  labelTextClass?: string;
  compact?: boolean;
}

const FormSelect: Component<FormSelectProps> = (props) => {
  const [local, rest] = splitProps(props, ['label', 'options', 'containerClass', 'labelClass', 'labelTextClass', 'compact']);
  
  const defaultLabelClass = local.compact ? 'label' : 'px-1';
  const defaultLabelTextClass = local.compact 
    ? 'label-text font-bold' 
    : 'label-text font-black uppercase text-xs tracking-widest opacity-60';
  
  const defaultSelectClass = local.compact
    ? 'select select-bordered w-full'
    : 'select select-bordered h-14 w-full rounded-2xl bg-base-200/50 border-none font-bold text-lg focus:ring-2 focus:ring-primary px-6';

  return (
    <div class={`form-control w-full flex flex-col gap-2 ${local.containerClass || ''}`}>
      <label class={local.labelClass || defaultLabelClass}>
        <span class={local.labelTextClass || defaultLabelTextClass}>{local.label}</span>
      </label>
      <select 
        {...rest}
        class={`${defaultSelectClass} ${rest.class || ''}`}
      >
        <For each={local.options}>
          {(opt) => <option value={opt.value}>{opt.label}</option>}
        </For>
      </select>
    </div>
  );
};

export default FormSelect;
