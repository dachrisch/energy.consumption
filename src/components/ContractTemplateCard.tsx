import { Component } from 'solid-js';
import { A } from '@solidjs/router';
import { Gap } from '../lib/gapDetection';
import Icon from './Icon';

interface Meter {
  _id: string;
  name: string;
  type?: string;
}

interface ContractTemplateCardProps {
  gap: Gap;
  meter: Meter;
}

const ContractTemplateCard: Component<ContractTemplateCardProps> = (props) => {
  const formatDateForURL = (d: Date) => {
    // Create a local date string YYYY-MM-DD to avoid TZ shifts
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const meterColor = () => props.meter.type === 'power' ? 'var(--color-meter-power)' : 'var(--color-meter-gas)';

  return (
    <div class="card bg-warning/5 border-2 border-dashed border-warning/20 hover:border-warning/40 transition-all group">
      <div class="card-body p-6">
        <div class="flex items-center gap-3 mb-4">
          <div class="bg-warning/20 text-warning p-2 rounded-lg">
            <Icon name="warning" class="h-5 w-5" />
          </div>
          <h3 class="font-black text-sm uppercase tracking-widest text-warning opacity-80">Missing Coverage</h3>
        </div>

        <div class="space-y-1 mb-6">
          <p class="text-xs font-bold opacity-40">Period for {props.meter.name}:</p>
          <div class="flex items-center gap-2">
            <p class="text-sm font-black">
              {props.gap.startDate.toLocaleDateString()} — {props.gap.endDate.toLocaleDateString()}
            </p>
            <div 
              class="p-1 rounded-lg"
              style={{ "background-color": `color-mix(in srgb, ${meterColor()}, transparent 90%)`, "color": meterColor() }}
            >
              <Icon name={props.meter.type as 'power' | 'gas'} class="h-3 w-3" />
            </div>
          </div>
        </div>

        <A 
          href={`/contracts/add?meterId=${props.meter._id}&startDate=${formatDateForURL(props.gap.startDate)}&endDate=${formatDateForURL(props.gap.endDate)}`} 
          class="btn btn-warning btn-sm rounded-xl font-black"
        >
          Add Missing Contract
        </A>
      </div>
    </div>
  );
};

export default ContractTemplateCard;
