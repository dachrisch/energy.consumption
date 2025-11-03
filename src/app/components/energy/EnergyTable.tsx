'use client';

import { EnergyType, EnergyOptions, EnergySortField } from '../../types';
import { DeleteIcon, PlusCircleIcon } from '../icons';
import { getFilteredAndSortedData } from '../../handlers/energyHandlers';
import { formatDateToBrowserLocale } from '../../utils/dateUtils';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Pagination from '../Pagination';
import { getTypeIcon } from '@/app/utils/iconUtils';
import { useTableSort } from '@/app/hooks/useTableSort';
import { ITEMS_PER_PAGE } from '@/app/constants/ui';

interface EnergyTableProps {
  energyData: EnergyType[];
  onDelete: (id: string) => void;
  typeFilter: EnergyOptions | 'all';
  dateRange: { start: Date | null; end: Date | null };
}

const EnergyTable = ({
  energyData,
  onDelete,
  typeFilter,
  dateRange,
}: EnergyTableProps) => {
  const router = useRouter();
  const { sortField, sortOrder, handleSort, getSortIcon } = useTableSort<EnergySortField>("date", "desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(ITEMS_PER_PAGE);


  const filteredAndSortedData = getFilteredAndSortedData(energyData, typeFilter, dateRange, sortField, sortOrder);
  const totalItems = filteredAndSortedData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const currentData = filteredAndSortedData.slice(startIndex, endIndex);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(Math.max(1, Math.min(newPage, totalPages)));
  };

  if (totalItems === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-12 gap-4 text-muted-foreground cursor-pointer hover:text-primary transition-colors"
        onClick={() => router.push('/add')}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            router.push('/add');
          }
        }}
      >
        <PlusCircleIcon className="w-20 h-20" />
        <p className="text-xl font-semibold">No readings available</p>
        <p className="text-base">Click here to add your first reading</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
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
                Meter Reading {getSortIcon('amount')}
              </th>
              <th className="p-2 text-center align-middle">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentData.map((data) => (
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
                    className="button-icon-only text-destructive hover:text-destructive/80 p-1 rounded-full hover:bg-destructive/10"
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

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {currentData.map((data) => (
          <div key={data._id} className="energy-card">
            <div className="energy-card-header">
              <div className="flex items-center gap-2">
                {getTypeIcon(data.type, "w-5 h-5")}
                <span className="energy-card-type">{data.type}</span>
              </div>
              <div className="energy-card-actions">
                <button
                  onClick={() => onDelete(data._id)}
                  className="button-icon-only text-destructive hover:text-destructive/80 p-2 rounded-full hover:bg-destructive/10"
                  title="Delete entry"
                  aria-label="Delete entry"
                >
                  <DeleteIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="energy-card-body">
              <div className="energy-card-row">
                <span className="energy-card-label">Date</span>
                <span className="energy-card-value">
                  {formatDateToBrowserLocale(data.date)}
                </span>
              </div>
              <div className="energy-card-row">
                <span className="energy-card-label">Meter Reading</span>
                <span className="energy-card-value">{data.amount}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
    </>
  );
};
export default EnergyTable;