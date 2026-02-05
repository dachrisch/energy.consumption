import { Component } from 'solid-js';
import FormInput from './FormInput';
import FormSelect from './FormSelect';

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

const MeterForm: Component<MeterFormProps> = (props) => {
  const gridClass = () => props.compact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2';
  const spacingClass = () => props.compact ? 'space-y-4' : 'space-y-8';
  const gapClass = () => props.compact ? 'gap-4' : 'gap-6';

  return (
    <form class={spacingClass()}>
      <div class={`grid ${gridClass()} ${gapClass()}`}>
        <FormInput 
          label="Meter Name"
          placeholder={props.compact ? "e.g., Main Apartment" : "e.g. Main Electricity"}
          value={props.name}
          onInput={(e) => props.setName(e.currentTarget.value)}
          disabled={props.isLoading}
          compact={props.compact}
          required
        />
        <FormInput 
          label="Meter Number"
          placeholder={props.compact ? "e.g., 12345678" : "F012345"}
          value={props.meterNumber}
          onInput={(e) => props.setMeterNumber(e.currentTarget.value)}
          disabled={props.isLoading}
          compact={props.compact}
          required
        />
      </div>

      <div class={`grid ${gridClass()} ${gapClass()}`}>
        <FormSelect 
          label={props.compact ? 'Type' : 'Utility Type'}
          value={props.type}
          onChange={(e) => {
            props.setType(e.currentTarget.value);
            if (e.currentTarget.value === 'power') {
              props.setUnit('kWh');
            } else if (e.currentTarget.value === 'gas' || e.currentTarget.value === 'water') {
              props.setUnit('m³');
            }
          }}
          options={[
            { value: 'power', label: 'Power (Electricity)' },
            { value: 'gas', label: 'Natural Gas' },
            { value: 'water', label: 'Water' }
          ]}
          disabled={props.isLoading}
          compact={props.compact}
          required
        />
        <FormInput 
          label={props.compact ? 'Unit' : 'Reporting Unit'}
          placeholder="kWh"
          value={props.unit}
          onInput={(e) => props.setUnit(e.currentTarget.value)}
          disabled={props.isLoading}
          compact={props.compact}
          required
        />
      </div>
    </form>
  );
};

export default MeterForm;
