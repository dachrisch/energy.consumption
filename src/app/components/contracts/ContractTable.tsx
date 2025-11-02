'use client';

import { ContractType, EnergyOptions, ContractsSortField } from '../../types';
import { DeleteIcon, AddContractIcon, EditIcon } from '../icons';
import { formatDateToBrowserLocale } from '../../utils/dateUtils';
import { useState } from 'react';
import Pagination from '../Pagination';
import { getTypeIcon } from '@/app/utils/iconUtils';
import { useTableSort } from '@/app/hooks/useTableSort';
import { ITEMS_PER_PAGE } from '@/app/constants/ui';

interface ContractTableProps {
  contracts: ContractType[];
  onDelete: (id: string) => void;
  onEdit: (contract: ContractType) => void;
  typeFilter: EnergyOptions | 'all';
}

const ContractTable = ({
  contracts,
  onDelete,
  onEdit,
  typeFilter,
}: ContractTableProps) => {
  const { sortField, sortOrder, handleSort, getSortIcon } = useTableSort<ContractsSortField>("startDate", "desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(ITEMS_PER_PAGE);

  const filteredData = contracts.filter(contract => 
    typeFilter === 'all' || contract.type === typeFilter
  );

  const sortedData = [...filteredData].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (aValue === undefined) return 1;
    if (bValue === undefined) return -1;
    
    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const totalItems = sortedData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const currentData = sortedData.slice(startIndex, endIndex);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(Math.max(1, Math.min(newPage, totalPages)));
  };

  if (totalItems === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-2 text-muted-foreground">
        <AddContractIcon className="w-12 h-12" />
        <p className="text-lg">No Contracts available</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-secondary text-secondary-foreground">
              <th
                className="p-2 cursor-pointer hover:bg-secondary/80 text-center align-middle"
                onClick={() => handleSort('type')}
                data-testid="column-type"
              >
                Type {getSortIcon('type')}
              </th>
              <th
                className="p-2 cursor-pointer hover:bg-secondary/80 text-center align-middle"
                onClick={() => handleSort('startDate')}
                data-testid="column-start"
              >
                Start {getSortIcon('startDate')}
              </th>
              <th
                className="p-2 cursor-pointer hover:bg-secondary/80 text-center align-middle"
                onClick={() => handleSort('endDate')}
                data-testid="column-end"
              >
                End {getSortIcon('endDate')}
              </th>
              <th
                className="p-2 cursor-pointer hover:bg-secondary/80 text-center align-middle"
                onClick={() => handleSort('basePrice')}
                data-testid="column-base-price"
              >
                Base Price {getSortIcon('basePrice')}
              </th>
              <th
                className="p-2 cursor-pointer hover:bg-secondary/80 text-center align-middle"
                onClick={() => handleSort('workingPrice')}
                data-testid="column-working-price"
              >
                Working Price {getSortIcon('workingPrice')}
              </th>
              <th
                className="p-2 text-center align-middle"
                data-testid="column-actions"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {currentData.map((contract) => (
              <tr key={contract._id} className="hover:bg-secondary/10">
                <td className="p-2 text-center align-middle">
                  <div className="flex items-center justify-center gap-2">
                    {getTypeIcon(contract.type)}
                    <span className="capitalize">{contract.type}</span>
                  </div>
                </td>
                <td className="p-2 text-center align-middle">
                  {formatDateToBrowserLocale(contract.startDate)}
                </td>
                <td className="p-2 text-center align-middle">
                  {contract.endDate ? formatDateToBrowserLocale(contract.endDate) : '-'}
                </td>
                <td className="p-2 text-center align-middle">
                  {contract.basePrice.toFixed(2)}
                </td>
                <td className="p-2 text-center align-middle">
                  {contract.workingPrice.toFixed(4)}
                </td>
                <td className="p-2 text-center align-middle flex justify-center gap-2">
                  <button
                    onClick={() => onEdit(contract)}
                    className="button-icon-only text-primary hover:text-primary/80 p-1 rounded-full hover:bg-primary/10"
                    title="Edit contract"
                    data-testid="contract-edit-button"
                  >
                    <EditIcon aria-label="Update contract" />
                  </button>
                  <button
                    onClick={() => onDelete(contract._id)}
                    className="button-icon-only text-destructive hover:text-destructive/80 p-1 rounded-full hover:bg-destructive/10"
                    title="Delete contract"
                  >
                    <DeleteIcon aria-label="Delete contract"/>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
    </>
  );
};

export default ContractTable;