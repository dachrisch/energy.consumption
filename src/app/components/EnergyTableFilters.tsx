'use client';

import { EnergyType } from '../types';
import { PowerIcon, GasIcon } from './icons';

interface EnergyTableFiltersProps {
  typeFilter: EnergyType | 'all';
  setTypeFilter: (type: EnergyType | 'all') => void;
  dateRange: { start: string; end: string };
  setDateRange: (range: { start: string; end: string }) => void;
  onReset: () => void;
}

const EnergyTableFilters = ({
  typeFilter,
  setTypeFilter,
  dateRange,
  setDateRange,
  onReset,
}: EnergyTableFiltersProps) => {
  return (
    <div className="mb-4 flex gap-4 items-center flex-wrap">
      <div className="flex items-center gap-4">
        <label className="block text-sm font-medium text-foreground">Type:</label>
        <div className="flex gap-2">
          <label
            className={`flex-1 flex items-center justify-center gap-2 p-2 border rounded cursor-pointer transition-colors ${
              typeFilter === 'all'
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-input text-foreground border-border hover:bg-secondary"
            }`}
          >
            <input
              type="radio"
              name="typeFilter"
              value="all"
              checked={typeFilter === 'all'}
              onChange={(e) => setTypeFilter(e.target.value as EnergyType | 'all')}
              className="hidden"
            />
            All
          </label>
          <label
            className={`flex-1 flex items-center justify-center gap-2 p-2 border rounded cursor-pointer transition-colors ${
              typeFilter === 'power'
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-input text-foreground border-border hover:bg-secondary"
            }`}
          >
            <input
              type="radio"
              name="typeFilter"
              value="power"
              checked={typeFilter === 'power'}
              onChange={(e) => setTypeFilter(e.target.value as EnergyType | 'all')}
              className="hidden"
            />
            <PowerIcon />
            Power
          </label>
          <label
            className={`flex-1 flex items-center justify-center gap-2 p-2 border rounded cursor-pointer transition-colors ${
              typeFilter === 'gas'
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-input text-foreground border-border hover:bg-secondary"
            }`}
          >
            <input
              type="radio"
              name="typeFilter"
              value="gas"
              checked={typeFilter === 'gas'}
              onChange={(e) => setTypeFilter(e.target.value as EnergyType | 'all')}
              className="hidden"
            />
            <GasIcon />
            Gas
          </label>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <label className="block text-sm font-medium text-foreground">Date Range:</label>
        <div className="flex gap-2 items-center">
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            className="p-2 border rounded bg-input text-foreground border-border focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Start date"
          />
          <span className="text-foreground">to</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            className="p-2 border rounded bg-input text-foreground border-border focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="End date"
          />
        </div>
      </div>
      <button
        onClick={onReset}
        className="ml-auto px-3 py-1 text-sm bg-secondary text-secondary-foreground rounded hover:bg-secondary/80"
      >
        Reset Filters
      </button>
    </div>
  );
};

export default EnergyTableFilters; 