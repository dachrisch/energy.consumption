import { useState } from 'react';
import { EnergyData, EnergyType, SortField, SortOrder } from '../types';
import { PowerIcon, GasIcon, DeleteIcon } from './icons';
import { getFilteredAndSortedData } from '../handlers/energyHandlers';
import { formatDateToBrowserLocale } from '../utils/dateUtils';

interface EnergyTableProps {
  energyData: EnergyData[];
  onDelete: (id: string) => void;
}

export function EnergyTable({ energyData, onDelete }: EnergyTableProps) {
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [typeFilter, setTypeFilter] = useState<EnergyType | 'all'>('all');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: ''
  });

  const getTypeIcon = (type: EnergyType) => {
    return type === 'power' ? <PowerIcon /> : <GasIcon />;
  };

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (field !== sortField) return null;
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  return (
    <div className="border border-border rounded-lg p-4">
      {/* Filters */}
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
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="p-2 border rounded bg-input text-foreground border-border focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Start date"
            />
            <span className="text-foreground">to</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="p-2 border rounded bg-input text-foreground border-border focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="End date"
            />
          </div>
        </div>
        <button
          onClick={() => {
            setTypeFilter('all');
            setDateRange({ start: '', end: '' });
            setSortField('date');
            setSortOrder('desc');
          }}
          className="ml-auto px-3 py-1 text-sm bg-secondary text-secondary-foreground rounded hover:bg-secondary/80"
        >
          Reset Filters
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-secondary text-secondary-foreground">
              <th 
                className="p-2 cursor-pointer hover:bg-secondary/80 text-center align-middle"
                onClick={() => handleSort('date')}
              >
                Date {getSortIcon('date')}
              </th>
              <th 
                className="p-2 cursor-pointer hover:bg-secondary/80 text-center align-middle"
                onClick={() => handleSort('type')}
              >
                Type {getSortIcon('type')}
              </th>
              <th 
                className="p-2 cursor-pointer hover:bg-secondary/80 text-center align-middle"
                onClick={() => handleSort('amount')}
              >
                Amount {getSortIcon('amount')}
              </th>
              <th className="p-2 text-center align-middle">Actions</th>
            </tr>
          </thead>
          <tbody>
            {getFilteredAndSortedData(energyData, typeFilter, dateRange, sortField, sortOrder).map((data) => (
              <tr key={data._id} className="hover:bg-secondary/10">
                <td className="p-2 text-center align-middle">{formatDateToBrowserLocale(data.date)}</td>
                <td className="p-2 text-center align-middle">
                  <div className="flex items-center justify-center gap-2">
                    {getTypeIcon(data.type)}
                    <span className="capitalize">{data.type}</span>
                  </div>
                </td>
                <td className="p-2 text-center align-middle">{data.amount}</td>
                <td className="p-2 text-center align-middle">
                  <button
                    onClick={() => onDelete(data._id)}
                    className="text-destructive hover:text-destructive/80 p-1 rounded-full hover:bg-destructive/10"
                    title="Delete entry"
                  >
                    <DeleteIcon />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 