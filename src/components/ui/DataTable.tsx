import React from "react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "./table";

interface Column<T> {
  key: string;
  label: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
}

export function DataTable<T extends { id: string }>({
  data,
  columns,
  onEdit,
  onDelete,
}: DataTableProps<T>) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((col) => (
            <TableHead key={col.key}>{col.label}</TableHead>
          ))}
          {(onEdit || onDelete) && <TableHead>Acciones</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((item) => (
          <TableRow key={item.id}>
            {columns.map((col) => (
              <TableCell key={col.key}>{(item as any)[col.key]}</TableCell>
            ))}
            {(onEdit || onDelete) && (
              <TableCell>
                {onEdit && <button onClick={() => onEdit(item)}>Editar</button>}
                {onDelete && <button onClick={() => onDelete(item)}>Eliminar</button>}
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
