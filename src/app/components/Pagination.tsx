import React from 'react';
import { DoubleArrowLeftIcon, DoubleArrowRightIcon } from './icons';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  return (
    <div className="flex justify-center items-center mt-4">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="btn mr-2 rounded-full"
      >
        <DoubleArrowLeftIcon />
      </button>
      <span>
        Page {currentPage} of {totalPages}
      </span>
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className=" ml-2 rounded-full"
      >
        <DoubleArrowRightIcon />
      </button>
    </div>
  );
};

export default Pagination;