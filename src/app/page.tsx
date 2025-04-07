"use client";

import { useState, useEffect } from "react";
import AddEnergyForm from "./components/AddEnergyForm";
import { CSVDropZone } from './components/CSVImportModal';
import { EnergyTable } from './components/EnergyTable';
import Toast from './components/Toast';
import { EnergyData } from './types';
import { 
  handleAddEnergy, 
  handleDelete, 
  handleCSVImport, 
  getLatestValues
} from './handlers/energyHandlers';

export default function Home() {
  const [energyData, setEnergyData] = useState<EnergyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

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

        <EnergyTable 
          energyData={energyData}
          onDelete={onDelete}
        />

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
