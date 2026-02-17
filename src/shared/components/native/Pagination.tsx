import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
  startIndex: number;
  endIndex: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  itemsPerPage,
  totalItems,
  startIndex,
  endIndex,
  onPageChange,
}: PaginationProps) {
  return (
    <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between">
      <div className="text-sm text-gray-600">
        Mostrando <span className="font-medium">{Math.min(startIndex + 1, totalItems)}</span> a <span className="font-medium">{Math.min(endIndex, totalItems)}</span> de <span className="font-medium">{totalItems}</span>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
          disabled={currentPage === 1}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Anterior
        </button>
        <div className="flex items-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`px-3 py-2 rounded-lg transition-colors ${
                currentPage === page
                  ? 'bg-gray-900 text-white'
                  : 'border border-gray-300 text-gray-700 hover:bg-gray-100'
              }`}
            >
              {page}
            </button>
          ))}
        </div>
        <button
          onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
          disabled={currentPage === totalPages || totalItems === 0}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
