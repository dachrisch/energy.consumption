import { Component } from 'solid-js';
import { A } from '@solidjs/router';

interface MeterTabsProps {
  meterId: string;
  active: 'overview' | 'history' | 'contracts';
}

const MeterTabs: Component<MeterTabsProps> = (props) => (
  <nav aria-label="Meter sections" class="tabs tabs-box w-full sm:w-fit">
    <A
      href={`/meters/${props.meterId}`}
      class={`tab flex-1 sm:flex-none ${props.active === 'overview' ? 'tab-active' : ''}`}
      aria-current={props.active === 'overview' ? 'page' : undefined}
    >
      Overview
    </A>
    <A
      href={`/meters/${props.meterId}/readings`}
      class={`tab flex-1 sm:flex-none ${props.active === 'history' ? 'tab-active' : ''}`}
      aria-current={props.active === 'history' ? 'page' : undefined}
    >
      History
    </A>
    <A
      href={`/meters/${props.meterId}?tab=contracts`}
      class={`tab flex-1 sm:flex-none ${props.active === 'contracts' ? 'tab-active' : ''}`}
      aria-current={props.active === 'contracts' ? 'page' : undefined}
    >
      Contracts
    </A>
  </nav>
);

export default MeterTabs;
