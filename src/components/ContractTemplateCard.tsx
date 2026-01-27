import { Component } from 'solid-js';
import { A } from '@solidjs/router';
import { Gap } from '../lib/gapDetection';

interface Meter {
  _id: string;
  name: string;
}

interface ContractTemplateCardProps {
  gap: Gap;
  meter: Meter;
}

const ContractTemplateCard: Component<ContractTemplateCardProps> = (props) => {
  const formatDate = (d: Date) => d.toISOString().split('T')[0];

  return (
    <div class="card bg-warning/5 border-2 border-dashed border-warning/20 hover:border-warning/40 transition-all group">
      <div class="card-body p-6">
        <div class="flex items-center gap-3 mb-4">
          <div class="bg-warning/20 text-warning p-2 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <h3 class="font-black text-sm uppercase tracking-widest text-warning opacity-80">Missing Coverage</h3>
        </div>

        <div class="space-y-1 mb-6">
          <p class="text-xs font-bold opacity-40">Period for {props.meter.name}:</p>
          <p class="text-sm font-black">
            {props.gap.startDate.toLocaleDateString()} — {props.gap.endDate.toLocaleDateString()}
          </p>
        </div>

        <A 
          href={`/contracts/add?meterId=${props.meter._id}&startDate=${formatDate(props.gap.startDate)}&endDate=${formatDate(props.gap.endDate)}`} 
          class="btn btn-warning btn-sm rounded-xl font-black"
        >
          Add Missing Contract
        </A>
      </div>
    </div>
  );
};

export default ContractTemplateCard;
