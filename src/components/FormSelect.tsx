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
    ? 'label-text text-[11px] font-bold uppercase tracking-wider opacity-50' 
    : 'label-text text-[11px] font-bold uppercase tracking-wider opacity-50';
  
  const defaultSelectClass = local.compact
    ? 'select select-bordered select-sm w-full rounded-xl'
    : 'select select-bordered h-12 w-full rounded-xl bg-base-200/50 border border-base-content/10 font-bold text-base focus:ring-2 focus:ring-primary px-4';

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
