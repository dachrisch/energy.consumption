import { Component, JSX } from 'solid-js';
import { A } from '@solidjs/router';

type ColorScheme = 'warning' | 'neutral' | 'primary';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: JSX.Element;
  actionLabel?: string;
  actionLink?: string;
  onAction?: () => void;
  compact?: boolean;
  colorScheme?: ColorScheme;
}

const EmptyState: Component<EmptyStateProps> = (props) => {
  const scheme = props.colorScheme || 'warning';
  
  const getClasses = () => {
    if (scheme === 'neutral') {
      return {
        container: 'bg-base-200/20 border-base-content/20 hover:border-base-content/30',
        icon: 'bg-base-200 text-base-content/40',
        title: 'text-base-content/60',
        button: 'btn-ghost bg-base-200 hover:bg-base-300 text-base-content shadow-none'
      };
    }
    if (scheme === 'primary') {
      return {
        container: 'bg-primary/5 border-primary/20 hover:border-primary/40',
        icon: 'bg-primary/10 text-primary',
        title: 'text-primary',
        button: 'btn-primary shadow-xl shadow-primary/20'
      };
    }
    // default warning
    return {
      container: 'bg-warning/5 border-warning/20 hover:border-warning/40',
      icon: 'bg-warning/10 text-warning',
      title: 'text-warning',
      button: 'btn-warning shadow-xl shadow-warning/20'
    };
  };
  
  const classes = getClasses();

  return (
    <div class={`col-span-full card border-2 border-dashed text-center group transition-all ${classes.container} ${props.compact ? 'p-8' : 'py-20'}`}>
      <div class="card-body items-center text-center p-0">
        <div class={`p-6 rounded-full mb-4 ${classes.icon}`}>
          {props.icon || (
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          )}
        </div>
        <h3 class={`text-xl font-black uppercase tracking-widest ${classes.title}`}>{props.title}</h3>
        <p class="text-base-content/60 font-bold mb-6 max-w-sm">{props.description}</p>
        
        {props.actionLabel && (
          props.actionLink ? (
            <A href={props.actionLink} class={`btn btn-wide rounded-2xl font-black ${classes.button}`}>
              {props.actionLabel}
            </A>
          ) : (
            <button onClick={props.onAction} class={`btn btn-wide rounded-2xl font-black ${classes.button}`}>
              {props.actionLabel}
            </button>
          )
        )}
      </div>
    </div>
  );
};

export default EmptyState;
