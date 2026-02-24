import { useState } from 'react';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from './Table';
import { Button } from './Button';
import { Input } from './Input';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

interface Column<T> {
  key: string;
  label: string;
  width?: string; // 👈 NUEVO
  render?: (item: T) => React.ReactNode;
}


interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchPlaceholder?: string;
  onRowClick?: (item: T) => void;
  itemsPerPage?: number;
}

export function DataTable<T extends { id: string | number }>(
  { data, columns, searchPlaceholder = 'Buscar...', onRowClick, itemsPerPage = 10 }: DataTableProps<T>
) {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Filtrar datos
  const filteredData = data.filter((item) =>
    Object.values(item).some((value) =>
      String(value).toLowerCase().includes(search.toLowerCase())
    )
  );

  // Paginación
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-4">
      {/* Búsqueda */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10 w-full h-10 py-0 text-sm"
          />
        </div>
        <div className="text-sm text-gray-600">
          {filteredData.length} registro{filteredData.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Tabla */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <Table>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableHeader
                  key={column.key}
                  style={column.width ? { width: column.width } : {}}
                  className={column.key === 'actions' ? 'text-right pr-6' : ''}
                >
                  {column.key === 'actions' ? (
                    <span className="float-right">{column.label}</span>
                  ) : (
                    column.label
                  )}
                </TableHeader>


              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.length > 0 ? (
              paginatedData.map((item) => (
                <TableRow
                  key={item.id}
                  onClick={() => onRowClick?.(item)}
                  className={onRowClick ? 'cursor-pointer' : ''}
                >
                  {columns.map((column) => (
                    <TableCell
                      key={column.key}
                      style={column.width ? { width: column.width } : {}}
                    >

                      {column.render
                        ? column.render(item)
                        : String((item as any)[column.key] || '-')}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center text-gray-500">
                  No se encontraron registros
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="bg-gray-50 border-t border-gray-200 px-4 py-3 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Mostrando <span className="font-medium">{Math.min(startIndex + 1, filteredData.length)}</span> a <span className="font-medium">{Math.min(startIndex + itemsPerPage, filteredData.length)}</span> de <span className="font-medium">{filteredData.length}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Anterior
            </button>
            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
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
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
