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
    ? 'label-text font-bold' 
    : 'label-text font-black uppercase text-xs tracking-widest opacity-60';
  
  const defaultInputClass = local.compact
    ? 'input input-bordered w-full'
    : 'input input-bordered h-14 w-full rounded-2xl bg-base-200/50 border-none font-bold text-lg focus:ring-2 focus:ring-primary px-6';

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
