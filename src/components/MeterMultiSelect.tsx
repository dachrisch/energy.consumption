import { Component, For, createSignal, createEffect } from 'solid-js';
import { IMeter as Meter } from '../types/models';
import Icon from './Icon';

interface MeterMultiSelectProps {
  meters: Meter[];
  selectedMeterIds: Set<string>;
  onSelectionChange: (selectedIds: Set<string>) => void;
}

interface MeterSectionProps {
  type: 'power' | 'gas';
  label: string;
  meters: Meter[];
  selectedMeterIds: Set<string>;
  onToggleType: (type: 'power' | 'gas') => void;
  onToggleMeter: (meterId: string) => void;
}

const MeterSection: Component<MeterSectionProps> = (props) => {
  const isSelected = () => props.meters.every(m => props.selectedMeterIds.has(m._id));
  const selectedCount = () => props.meters.filter(m => props.selectedMeterIds.has(m._id)).length;

  return (
    <div class={`space-y-2 ${props.type === 'gas' ? 'border-t border-base-300 pt-3' : ''}`}>
      <label class="flex items-center gap-2 cursor-pointer p-2 hover:bg-base-200 rounded-lg">
        <input
          type="checkbox"
          class="checkbox checkbox-sm"
          checked={isSelected()}
          onChange={() => props.onToggleType(props.type)}
        />
        <span class="font-bold text-sm flex-1">{props.label}</span>
        <span class="text-xs opacity-60">{selectedCount()}/{props.meters.length}</span>
      </label>
      <div class="ml-4 space-y-1">
        <For each={props.meters}>
          {(meter) => (
            <label class="flex items-center gap-2 cursor-pointer p-2 hover:bg-base-200 rounded-lg">
              <input
                type="checkbox"
                class="checkbox checkbox-xs"
                checked={props.selectedMeterIds.has(meter._id)}
                onChange={() => props.onToggleMeter(meter._id)}
              />
              <span class="text-sm">{meter.name}</span>
            </label>
          )}
        </For>
      </div>
    </div>
  );
};

const MeterMultiSelect: Component<MeterMultiSelectProps> = (props) => {
  const [showDropdown, setShowDropdown] = createSignal(false);
  const [selectedCount, setSelectedCount] = createSignal(0);

  createEffect(() => {
    setSelectedCount(props.selectedMeterIds.size);
  });

  const toggleMeter = (meterId: string) => {
    const newSelection = new Set(props.selectedMeterIds);
    if (newSelection.has(meterId)) {
      newSelection.delete(meterId);
    } else {
      newSelection.add(meterId);
    }
    props.onSelectionChange(newSelection);
  };

  const toggleMeterType = (type: 'power' | 'gas') => {
    const metersOfType = props.meters.filter(m => m.type === type);
    const allOfTypeSelected = metersOfType.every(m => props.selectedMeterIds.has(m._id));

    const newSelection = new Set(props.selectedMeterIds);
    metersOfType.forEach(m => {
      if (allOfTypeSelected) {
        newSelection.delete(m._id);
      } else {
        newSelection.add(m._id);
      }
    });
    props.onSelectionChange(newSelection);
  };

  const powerMeters = () => props.meters.filter(m => m.type === 'power');
  const gasMeters = () => props.meters.filter(m => m.type === 'gas');

  return (
    <div class="relative w-full">
      <button
        class="btn btn-outline w-full rounded-xl gap-2 text-sm font-bold"
        onClick={() => setShowDropdown(!showDropdown())}
      >
        <Icon name="filter" class="h-4 w-4" />
        Meters ({selectedCount()})
      </button>

      {showDropdown() && (
        <div class="absolute top-full left-0 right-0 mt-2 bg-base-100 border border-base-300 rounded-xl shadow-lg z-50 p-4 space-y-3">
          {powerMeters().length > 0 && (
            <MeterSection
              type="power"
              label="Power Meters"
              meters={powerMeters()}
              selectedMeterIds={props.selectedMeterIds}
              onToggleType={toggleMeterType}
              onToggleMeter={toggleMeter}
            />
          )}

          {gasMeters().length > 0 && (
            <MeterSection
              type="gas"
              label="Gas Meters"
              meters={gasMeters()}
              selectedMeterIds={props.selectedMeterIds}
              onToggleType={toggleMeterType}
              onToggleMeter={toggleMeter}
            />
          )}

          {props.meters.length === 0 && (
            <p class="text-sm opacity-60 text-center py-2">No meters available</p>
          )}
        </div>
      )}

      {/* Close dropdown when clicking outside */}
      {showDropdown() && (
        <div
          class="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
};

export default MeterMultiSelect;
