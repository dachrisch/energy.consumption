import { SortOrder } from 'mongoose';
import { EnergyType, EnergyOptions, EnergySortField } from '../types';


export const getLatestValues = (energyData: EnergyType[]) => {
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
  energyData: EnergyType[],
  typeFilter: EnergyOptions | 'all',
  dateRange: { start: Date | null; end: Date | null },
  sortField: EnergySortField,
  sortOrder: SortOrder
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