import { EnergyData, EnergyType } from '../types';

export const handleAddEnergy = async (newData: Omit<EnergyData, '_id'>) => {
  try {
    const response = await fetch('/api/energy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newData),
    });

    if (!response.ok) throw new Error('Failed to add data');
    
    return true;
  } catch (err) {
    console.error('Error adding energy data:', err);
    throw new Error('Failed to add energy data');
  }
};

export const handleDelete = async (id: string) => {
  try {
    const response = await fetch(`/api/energy?id=${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) throw new Error('Failed to delete data');
    
    return true;
  } catch (err) {
    console.error('Error deleting energy data:', err);
    throw new Error('Failed to delete energy data');
  }
};

export const handleCSVImport = async (data: Omit<EnergyData, '_id'>[], existingData: EnergyData[]) => {
  try {
    // Sort data by date to ensure proper order
    const sortedData = [...data].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const result = {
      success: 0,
      skipped: 0,
      error: 0
    };

    // Add each entry individually
    for (const entry of sortedData) {
      try {
        // Check if entry already exists
        const exists = existingData.some(
          (existing) => 
            existing.date === entry.date && 
            existing.type === entry.type
        );

        if (exists) {
          result.skipped++;
          continue;
        }

        await handleAddEnergy(entry);
        result.success++;
      } catch (error) {
        console.error('Error importing entry:', error);
        result.error++;
      }
    }

    return result;
  } catch (error) {
    console.error('Error importing CSV data:', error);
    throw new Error('Failed to import CSV data');
  }
};

export const getLatestValues = (energyData: EnergyData[]) => {
  const latestPower = energyData
    .filter(data => data.type === 'power')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]?.amount || 0;
  
  const latestGas = energyData
    .filter(data => data.type === 'gas')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]?.amount || 0;

  return {
    power: latestPower,
    gas: latestGas
  };
};

export const getFilteredAndSortedData = (
  energyData: EnergyData[],
  typeFilter: EnergyType | 'all',
  dateRange: { start: string; end: string },
  sortField: 'date' | 'type' | 'amount',
  sortOrder: 'asc' | 'desc'
) => {
  let filtered = [...energyData];

  // Apply type filter
  if (typeFilter !== 'all') {
    filtered = filtered.filter(data => data.type === typeFilter);
  }

  // Apply date range filter
  if (dateRange.start || dateRange.end) {
    filtered = filtered.filter(data => {
      const date = new Date(data.date);
      const start = dateRange.start ? new Date(dateRange.start) : null;
      const end = dateRange.end ? new Date(dateRange.end) : null;
      
      if (start && date < start) return false;
      if (end && date > end) return false;
      return true;
    });
  }

  // Apply sorting
  filtered.sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case 'date':
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
        break;
      case 'type':
        comparison = a.type.localeCompare(b.type);
        break;
      case 'amount':
        comparison = a.amount - b.amount;
        break;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  return filtered;
}; 