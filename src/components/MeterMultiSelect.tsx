import { Component, For, createSignal, createEffect } from 'solid-js';
import { IMeter as Meter } from '../types/models';
import Icon from './Icon';

interface MeterMultiSelectProps {
  meters: Meter[];
  selectedMeterIds: Set<string>;
  onSelectionChange: (selectedIds: Set<string>) => void;
}

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

  const powerSelected = () => powerMeters().every(m => props.selectedMeterIds.has(m._id));
  const gasSelected = () => gasMeters().every(m => props.selectedMeterIds.has(m._id));

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
          {/* Power Meters Section */}
          {powerMeters().length > 0 && (
            <div class="space-y-2">
              <label class="flex items-center gap-2 cursor-pointer p-2 hover:bg-base-200 rounded-lg">
                <input
                  type="checkbox"
                  class="checkbox checkbox-sm"
                  checked={powerSelected()}
                  onChange={() => toggleMeterType('power')}
                />
                <span class="font-bold text-sm flex-1">Power Meters</span>
                <span class="text-xs opacity-60">{powerMeters().filter(m => props.selectedMeterIds.has(m._id)).length}/{powerMeters().length}</span>
              </label>
              <div class="ml-4 space-y-1">
                <For each={powerMeters()}>
                  {(meter) => (
                    <label class="flex items-center gap-2 cursor-pointer p-2 hover:bg-base-200 rounded-lg">
                      <input
                        type="checkbox"
                        class="checkbox checkbox-xs"
                        checked={props.selectedMeterIds.has(meter._id)}
                        onChange={() => toggleMeter(meter._id)}
                      />
                      <span class="text-sm">{meter.name}</span>
                    </label>
                  )}
                </For>
              </div>
            </div>
          )}

          {/* Gas Meters Section */}
          {gasMeters().length > 0 && (
            <div class="space-y-2 border-t border-base-300 pt-3">
              <label class="flex items-center gap-2 cursor-pointer p-2 hover:bg-base-200 rounded-lg">
                <input
                  type="checkbox"
                  class="checkbox checkbox-sm"
                  checked={gasSelected()}
                  onChange={() => toggleMeterType('gas')}
                />
                <span class="font-bold text-sm flex-1">Gas Meters</span>
                <span class="text-xs opacity-60">{gasMeters().filter(m => props.selectedMeterIds.has(m._id)).length}/{gasMeters().length}</span>
              </label>
              <div class="ml-4 space-y-1">
                <For each={gasMeters()}>
                  {(meter) => (
                    <label class="flex items-center gap-2 cursor-pointer p-2 hover:bg-base-200 rounded-lg">
                      <input
                        type="checkbox"
                        class="checkbox checkbox-xs"
                        checked={props.selectedMeterIds.has(meter._id)}
                        onChange={() => toggleMeter(meter._id)}
                      />
                      <span class="text-sm">{meter.name}</span>
                    </label>
                  )}
                </For>
              </div>
            </div>
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
