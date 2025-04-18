'use client';

import { ContractType, EnergyOptions, ContractsSortField, SortOrder } from '../../types';
import { PowerIcon, GasIcon, DeleteIcon } from '../icons';
import { formatDateToBrowserLocale } from '../../utils/dateUtils';
import { useState } from 'react';
import Pagination from '../Pagination';

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
  const [sortField, setSortField] = useState<ContractsSortField>("startDate");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const getTypeIcon = (type: EnergyOptions) => {
    return type === 'power' ? <PowerIcon /> : <GasIcon />;
  };

  const handleSort = (field: ContractsSortField) => {
    if (field === sortField) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field: ContractsSortField) => {
    if (field !== sortField) return null;
    return sortOrder === 'asc' ? '↑' : '↓';
  };

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

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-secondary text-secondary-foreground">
              <th
                className="p-2 cursor-pointer hover:bg-secondary/80 text-center align-middle"
                onClick={() => handleSort('type')}
              >
                Type {getSortIcon('type')}
              </th>
              <th
                className="p-2 cursor-pointer hover:bg-secondary/80 text-center align-middle"
                onClick={() => handleSort('startDate')}
              >
                Start Date {getSortIcon('startDate')}
              </th>
              <th
                className="p-2 cursor-pointer hover:bg-secondary/80 text-center align-middle"
                onClick={() => handleSort('endDate')}
              >
                End Date {getSortIcon('endDate')}
              </th>
              <th
                className="p-2 cursor-pointer hover:bg-secondary/80 text-center align-middle"
                onClick={() => handleSort('basePrice')}
              >
                Base Price {getSortIcon('basePrice')}
              </th>
              <th
                className="p-2 cursor-pointer hover:bg-secondary/80 text-center align-middle"
                onClick={() => handleSort('workingPrice')}
              >
                Working Price {getSortIcon('workingPrice')}
              </th>
              <th className="p-2 text-center align-middle">Actions</th>
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
                    className="text-primary hover:text-primary/80 p-1 rounded-full hover:bg-primary/10"
                    title="Edit contract"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(contract._id)}
                    className="text-destructive hover:text-destructive/80 p-1 rounded-full hover:bg-destructive/10"
                    title="Delete contract"
                  >
                    <DeleteIcon />
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