'use client';

import { useState } from 'react';
import { EnergyDataType, EnergyType, SortField, SortOrder } from '../types';
import { PowerIcon, GasIcon, DeleteIcon } from './icons';
import { getFilteredAndSortedData } from '../handlers/energyHandlers';
import { formatDateToBrowserLocale } from '../utils/dateUtils';
import EnergyTableFilters from './EnergyTableFilters';

interface EnergyTableProps {
  energyData: EnergyDataType[];
  onDelete: (id: string) => void;
}

const EnergyTable = ({ energyData, onDelete }: EnergyTableProps) => {
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

  const handleResetFilters = () => {
    setTypeFilter('all');
    setDateRange({ start: '', end: '' });
    setSortField('date');
    setSortOrder('desc');
  };

  return (
    <div className="border border-border rounded-lg p-4">
      <EnergyTableFilters
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        dateRange={dateRange}
        setDateRange={setDateRange}
        sortField={sortField}
        setSortField={setSortField}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        onReset={handleResetFilters}
      />
      
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
};

export default EnergyTable;