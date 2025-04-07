"use client";

import { useState, useEffect } from "react";
import AddEnergyForm from "./components/AddEnergyForm";
import { CSVDropZone } from './components/CSVImportModal';
import Toast from './components/Toast';
import { EnergyData, EnergyType, SortField, SortOrder } from './types';
import { 
  handleAddEnergy, 
  handleDelete, 
  handleCSVImport, 
  getLatestValues, 
  getFilteredAndSortedData 
} from './handlers/energyHandlers';

export default function Home() {
  const [energyData, setEnergyData] = useState<EnergyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [typeFilter, setTypeFilter] = useState<EnergyType | 'all'>('all');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: ''
  });

  useEffect(() => {
    fetchEnergyData();
  }, []);

  const fetchEnergyData = async () => {
    try {
      const response = await fetch('/api/energy');
      if (!response.ok) throw new Error('Failed to fetch data');
      const data = await response.json();
      setEnergyData(data);
    } catch (err) {
      setError('Failed to load energy data');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const onAddEnergy = async (newData: Omit<EnergyData, '_id'>) => {
    try {
      await handleAddEnergy(newData);
      fetchEnergyData();
    } catch (err) {
      setError('Failed to add energy data');
      console.error(err);
    }
  };

  const onDelete = async (id: string) => {
    try {
      await handleDelete(id);
      fetchEnergyData();
    } catch (err) {
      setError('Failed to delete energy data');
      console.error(err);
    }
  };

  const onCSVImport = async (data: EnergyData[]) => {
    try {
      const result = await handleCSVImport(data, energyData);
      
      // Show import results
      const message = [
        result.success > 0 && `${result.success} entries imported`,
        result.skipped > 0 && `${result.skipped} entries skipped (already exist)`,
        result.error > 0 && `${result.error} entries failed`
      ].filter(Boolean).join(', ');

      setToast({
        message,
        type: result.error > 0 ? 'error' : 'success'
      });

      // Refresh the data
      fetchEnergyData();
    } catch (error) {
      console.error('Error importing CSV data:', error);
      setToast({
        message: 'Failed to import CSV data',
        type: 'error'
      });
    }
  };

  const getTypeIcon = (type: EnergyType) => {
    if (type === 'power') {
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-5 h-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.5 21v-5.25a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7.393 2.25 1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7.393 2.25 1.015a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72l1.189-1.19A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72M6.75 18h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .414.336.75.75.75z"
          />
        </svg>
      );
    } else {
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-5 h-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z"
          />
        </svg>
      );
    }
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

  if (isLoading) {
    return (
      <div className="min-h-screen p-8">
        <main className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Energy Consumption Monitor</h1>
          <p>Loading...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <main className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Energy Consumption Monitor</h1>
        
        <div className="mb-8">
          <CSVDropZone onDrop={onCSVImport} />
        </div>
        
        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}
        
        <AddEnergyForm 
          onSubmit={onAddEnergy} 
          latestValues={getLatestValues(energyData)}
        />

        {/* Filters */}
        <div className="mb-4 flex gap-4 items-center flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm text-foreground">Type:</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as EnergyType | 'all')}
              className="p-2 border rounded bg-input text-foreground border-border"
            >
              <option value="all">All</option>
              <option value="power">Power</option>
              <option value="gas">Gas</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-foreground">Date Range:</label>
            <div className="flex gap-2 items-center">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="p-2 border rounded bg-input text-foreground border-border"
                placeholder="Start date"
              />
              <span className="text-foreground">to</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="p-2 border rounded bg-input text-foreground border-border"
                placeholder="End date"
              />
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-secondary text-secondary-foreground">
                <th 
                  className="p-2 border border-border cursor-pointer hover:bg-secondary/80"
                  onClick={() => handleSort('date')}
                >
                  Date {getSortIcon('date')}
                </th>
                <th 
                  className="p-2 border border-border cursor-pointer hover:bg-secondary/80"
                  onClick={() => handleSort('type')}
                >
                  Type {getSortIcon('type')}
                </th>
                <th 
                  className="p-2 border border-border cursor-pointer hover:bg-secondary/80"
                  onClick={() => handleSort('amount')}
                >
                  Amount {getSortIcon('amount')}
                </th>
                <th className="p-2 border border-border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {getFilteredAndSortedData(energyData, typeFilter, dateRange, sortField, sortOrder).map((data) => (
                <tr key={data._id} className="border-b border-border">
                  <td className="p-2 border border-border">{data.date}</td>
                  <td className="p-2 border border-border">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(data.type)}
                      <span className="capitalize">{data.type}</span>
                    </div>
                  </td>
                  <td className="p-2 border border-border">{data.amount}</td>
                  <td className="p-2 border border-border">
                    <button
                      onClick={() => onDelete(data._id)}
                      className="text-destructive hover:text-destructive/80 p-1 rounded-full hover:bg-destructive/10"
                      title="Delete entry"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-5 h-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                        />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </main>
    </div>
  );
}
