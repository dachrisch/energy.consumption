import { Component, JSX, splitProps } from 'solid-js';

interface FormInputProps extends JSX.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  containerClass?: string;
  labelClass?: string;
  labelTextClass?: string;
  compact?: boolean;
}

const FormInput: Component<FormInputProps> = (props) => {
  const [local, rest] = splitProps(props, ['label', 'containerClass', 'labelClass', 'labelTextClass', 'compact']);
  
  const defaultLabelClass = local.compact ? 'label' : 'px-1';
  const defaultLabelTextClass = local.compact 
    ? 'label-text text-[11px] font-bold uppercase tracking-wider opacity-50' 
    : 'label-text text-[11px] font-bold uppercase tracking-wider opacity-50';
  
  const defaultInputClass = local.compact
    ? 'input input-bordered input-sm w-full rounded-xl'
    : 'input input-bordered h-12 w-full rounded-xl bg-base-200/50 border border-base-content/10 font-bold text-base focus:ring-2 focus:ring-primary px-4';

  return (
    <div class={`form-control w-full flex flex-col gap-2 ${local.containerClass || ''}`}>
      <label class={local.labelClass || defaultLabelClass}>
        <span class={local.labelTextClass || defaultLabelTextClass}>{local.label}</span>
      </label>
      <input 
        {...rest}
        class={`${defaultInputClass} ${rest.class || ''}`}
      />
    </div>
  );
};

export default FormInput;
