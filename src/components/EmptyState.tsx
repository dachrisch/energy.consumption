import { Component, JSX } from 'solid-js';
import { A } from '@solidjs/router';
import Icon from './Icon';

type ColorScheme = 'warning' | 'neutral' | 'primary';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: JSX.Element;
  actionLabel?: string;
  actionLink?: string;
  onAction?: () => void;
  compact?: boolean;
  colorScheme?: ColorScheme;
  inline?: boolean;
}

interface ClassesObj {
  container: string;
  icon: string;
  title: string;
  button: string;
}

const getColorClasses = (scheme: ColorScheme): ClassesObj => {
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

const DefaultIcon = () => (
  <Icon name="warning" class="h-12 w-12" />
);

const InlineIcon = () => (
  <Icon name="warning" class="h-5 w-5" />
);

const renderActionLink = (label: string | undefined, link: string | undefined, className: string) => {
  if (!label) {
    return null;
  }
  if (link) {
    return <A href={link} class={className}>{label}</A>;
  }
  return null;
};

const renderActionButton = (label: string | undefined, onClick: (() => void) | undefined, className: string) => {
  if (!label) {
    return null;
  }
  if (onClick) {
    return <button onClick={onClick} class={className}>{label}</button>;
  }
  return null;
};

const EmptyState: Component<EmptyStateProps> = (props) => {
   const scheme = props.colorScheme || 'warning';
   const classes = getColorClasses(scheme);

   // Inline mode: compact warning for modals
   if (props.inline) {
     const actionClasses = `btn btn-sm rounded-lg font-bold flex-shrink-0 ${classes.button}`;
     const actionElement = props.actionLink
       ? renderActionLink(props.actionLabel, props.actionLink, actionClasses)
       : renderActionButton(props.actionLabel, props.onAction, actionClasses);

     return (
       <div class={`border-2 border-dashed rounded-lg p-3 mb-4 ${classes.container}`}>
         <div class="flex items-center gap-2">
           <div class={`flex-shrink-0 p-2 rounded-full ${classes.icon}`}>
             {props.icon || <InlineIcon />}
           </div>
           <div class="flex-1 min-w-0">
             <div class={`text-sm font-bold uppercase tracking-wider ${classes.title}`}>{props.title}</div>
             {props.description && <div class="text-xs text-base-content/60">{props.description}</div>}
           </div>
           {actionElement}
         </div>
       </div>
     );
   }

  const wideActionClasses = `btn btn-wide rounded-2xl font-black ${classes.button}`;
  const wideActionElement = props.actionLink
    ? renderActionLink(props.actionLabel, props.actionLink, wideActionClasses)
    : renderActionButton(props.actionLabel, props.onAction, wideActionClasses);

  return (
     <div class={`card border-2 border-dashed text-center group transition-all ${classes.container} ${props.compact ? 'p-8' : 'py-20'} h-full flex flex-col justify-center`}>
       <div class="card-body items-center text-center p-0 flex-grow-0">
         <div class={`p-6 rounded-full mb-4 ${classes.icon}`}>
           {props.icon || <DefaultIcon />}
         </div>
         <h3 class={`text-xl font-black uppercase tracking-widest ${classes.title}`}>{props.title}</h3>
         <p class="text-base-content/60 font-bold mb-6 max-w-sm">{props.description}</p>
         {wideActionElement}
       </div>
     </div>
   );
 };

export default EmptyState;
