import { Component, createSignal } from 'solid-js';
import { formatDate } from '../lib/timeRangeCostCalculation';
import Icon from './Icon';

interface DateRangePickerProps {
  startDate: Date;
  endDate: Date;
  onStartDateChange: (date: Date) => void;
  onEndDateChange: (date: Date) => void;
  maxDate?: Date;
}

const DateRangePicker: Component<DateRangePickerProps> = (props) => {
  const [isOpen, setIsOpen] = createSignal(false);
  const today = props.maxDate || new Date();

  const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleStartDateChange = (e: Event) => {
    const input = e.target as HTMLInputElement;
    const newDate = new Date(input.value + 'T00:00:00');
    props.onStartDateChange(newDate);
  };

  const handleEndDateChange = (e: Event) => {
    const input = e.target as HTMLInputElement;
    const newDate = new Date(input.value + 'T23:59:59');
    props.onEndDateChange(newDate);
  };

  const getPresetDays = (days: number) => {
    const end = new Date(today);
    const start = new Date(end);
    start.setDate(start.getDate() - days);
    return { start, end };
  };

  const applyPreset = (days: number) => {
    const { start, end } = getPresetDays(days);
    props.onStartDateChange(start);
    props.onEndDateChange(end);
  };

  const daysDifference = () => {
    const diff = props.endDate.getTime() - props.startDate.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
  };

  return (
    <div class="relative">
      {/* Display Button */}
      <button
        class="w-full p-4 bg-base-200/50 rounded-xl border border-base-content/10 font-bold text-left hover:border-base-content/20 transition-all flex items-center justify-between"
        onClick={() => setIsOpen(!isOpen())}
      >
        <div class="flex items-center gap-2">
          <Icon name="calendar" class="h-5 w-5 opacity-60" />
          <div class="flex-1 min-w-0">
            <p class="text-xs font-black uppercase tracking-widest opacity-60 mb-1">Selected Period</p>
            <p class="text-sm font-black">
              {formatDate(props.startDate)} – {formatDate(props.endDate)}
            </p>
            <p class="text-xs opacity-60 mt-1">{daysDifference()} days</p>
          </div>
        </div>
        <Icon 
          name={isOpen() ? 'arrow-up' : 'arrow-down'} 
          class={`h-5 w-5 opacity-60 transition-transform ${isOpen() ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      {isOpen() && (
        <>
          {/* Backdrop */}
          <div
            class="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Picker Panel */}
          <div class="absolute top-full left-0 right-0 mt-2 bg-base-100 border border-base-content/10 rounded-xl shadow-lg z-50 p-4 space-y-4">
            {/* Preset Buttons */}
            <div class="grid grid-cols-2 gap-2">
              <button
                class="btn btn-sm btn-outline rounded-lg font-bold"
                onClick={() => { applyPreset(7); setIsOpen(false); }}
              >
                Last 7 days
              </button>
              <button
                class="btn btn-sm btn-outline rounded-lg font-bold"
                onClick={() => { applyPreset(30); setIsOpen(false); }}
              >
                Last 30 days
              </button>
              <button
                class="btn btn-sm btn-outline rounded-lg font-bold"
                onClick={() => { applyPreset(90); setIsOpen(false); }}
              >
                Last 90 days
              </button>
              <button
                class="btn btn-sm btn-outline rounded-lg font-bold"
                onClick={() => { applyPreset(365); setIsOpen(false); }}
              >
                Last year
              </button>
            </div>

            {/* Divider */}
            <div class="divider opacity-20 my-2" />

            {/* Custom Range */}
            <div class="space-y-3">
              <p class="text-xs font-black uppercase tracking-widest opacity-60">Custom Range</p>
              
              <div class="space-y-2">
                <label class="text-xs font-bold opacity-70">From</label>
                <input
                  type="date"
                  class="input input-bordered w-full rounded-lg font-bold text-sm"
                  value={formatDateForInput(props.startDate)}
                  onChange={handleStartDateChange}
                  max={formatDateForInput(props.endDate)}
                />
              </div>

              <div class="space-y-2">
                <label class="text-xs font-bold opacity-70">To</label>
                <input
                  type="date"
                  class="input input-bordered w-full rounded-lg font-bold text-sm"
                  value={formatDateForInput(props.endDate)}
                  onChange={handleEndDateChange}
                  min={formatDateForInput(props.startDate)}
                  max={formatDateForInput(today)}
                />
              </div>
            </div>

            {/* Apply Button */}
            <button
              class="btn btn-primary w-full rounded-lg font-bold"
              onClick={() => setIsOpen(false)}
            >
              Apply
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default DateRangePicker;
