import { Component } from 'solid-js';

interface MeterFormProps {
  name: string;
  setName: (v: string) => void;
  meterNumber: string;
  setMeterNumber: (v: string) => void;
  type: string;
  setType: (v: string) => void;
  unit: string;
  setUnit: (v: string) => void;
  isLoading?: boolean;
  compact?: boolean;
}

interface StyleConfig {
  gridClass: string;
  inputClass: string;
  selectClass: string;
  labelClass: string;
  labelTextClass: string;
  spacingClass: string;
  gapClass: string;
}

const getStyleConfig = (compact?: boolean): StyleConfig => {
  if (compact) {
    return {
      gridClass: 'grid-cols-1',
      inputClass: 'input input-bordered w-full',
      selectClass: 'select select-bordered w-full',
      labelClass: 'label',
      labelTextClass: 'label-text font-bold',
      spacingClass: 'space-y-4',
      gapClass: 'gap-4',
    };
  }
  return {
    gridClass: 'grid-cols-1 md:grid-cols-2',
    inputClass: 'input input-bordered h-14 rounded-2xl bg-base-200/50 border-none font-bold text-lg focus:ring-2 focus:ring-primary px-6',
    selectClass: 'select select-bordered h-14 rounded-2xl bg-base-200/50 border-none font-bold text-lg focus:ring-2 focus:ring-primary px-6',
    labelClass: 'px-1',
    labelTextClass: 'label-text font-black uppercase text-xs tracking-widest opacity-60',
    spacingClass: 'space-y-8',
    gapClass: 'gap-6',
  };
};

const MeterForm: Component<MeterFormProps> = (props) => {
  const styles = getStyleConfig(props.compact);
  const { gridClass, inputClass, selectClass, labelClass, labelTextClass, spacingClass, gapClass } = styles;

  return (
    <form class={spacingClass}>
      <div class={`grid ${gridClass} ${gapClass}`}>
        <div class="form-control w-full flex flex-col gap-2">
          <label class={labelClass}>
            <span class={labelTextClass}>Meter Name</span>
          </label>
          <input 
            type="text"
            placeholder={props.compact ? "e.g., Main Apartment" : "e.g. Main Electricity"}
            class={inputClass}
            value={props.name}
            onInput={(e) => props.setName(e.currentTarget.value)}
            disabled={props.isLoading}
            required
          />
        </div>
        <div class="form-control w-full flex flex-col gap-2">
          <label class={labelClass}>
            <span class={labelTextClass}>Meter Number</span>
          </label>
          <input 
            type="text"
            placeholder={props.compact ? "e.g., 12345678" : "F012345"}
            class={inputClass}
            value={props.meterNumber}
            onInput={(e) => props.setMeterNumber(e.currentTarget.value)}
            disabled={props.isLoading}
            required
          />
        </div>
      </div>

      <div class={`grid ${gridClass} ${gapClass}`}>
        <div class="form-control w-full flex flex-col gap-2">
          <label class={labelClass}>
            <span class={labelTextClass}>{props.compact ? 'Type' : 'Utility Type'}</span>
          </label>
          <select 
            class={selectClass}
            value={props.type}
            onChange={(e) => {
              props.setType(e.currentTarget.value);
              if (e.currentTarget.value === 'power') {
                props.setUnit('kWh');
              } else if (e.currentTarget.value === 'gas') {
                props.setUnit('m³');
              } else if (e.currentTarget.value === 'water') {
                props.setUnit('m³');
              }
            }}
            disabled={props.isLoading}
            required
          >
            <option value="power">Power (Electricity)</option>
            <option value="gas">Natural Gas</option>
            <option value="water">Water</option>
          </select>
        </div>
        <div class="form-control w-full flex flex-col gap-2">
          <label class={labelClass}>
            <span class={labelTextClass}>{props.compact ? 'Unit' : 'Reporting Unit'}</span>
          </label>
          <input 
            type="text"
            placeholder="kWh"
            class={inputClass}
            value={props.unit}
            onInput={(e) => props.setUnit(e.currentTarget.value)}
            disabled={props.isLoading}
            required
          />
        </div>
      </div>
    </form>
  );
};

export default MeterForm;
