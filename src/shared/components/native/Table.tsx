import { HTMLAttributes, ThHTMLAttributes, TdHTMLAttributes } from 'react';

interface TableProps extends HTMLAttributes<HTMLTableElement> {}
interface TableHeadProps extends HTMLAttributes<HTMLTableSectionElement> {}
interface TableBodyProps extends HTMLAttributes<HTMLTableSectionElement> {}
interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {}
interface TableHeaderProps extends ThHTMLAttributes<HTMLTableHeaderCellElement> {}
interface TableCellProps extends TdHTMLAttributes<HTMLTableCellElement> {}

export function Table({ className = '', ...props }: TableProps) {
  return (
    <div className="w-full overflow-auto">
      <table className={`w-full table-fixed border-collapse ${className}`} {...props} />

    </div>
  );
}

export function TableHead({ className = '', ...props }: TableHeadProps) {
  return <thead className={`bg-gray-50 ${className}`} {...props} />;
}

export function TableBody({ className = '', ...props }: TableBodyProps) {
  return <tbody className={`divide-y divide-gray-200 ${className}`} {...props} />;
}

export function TableRow({ className = '', ...props }: TableRowProps) {
  return <tr className={`hover:bg-gray-50 ${className}`} {...props} />;
}

export function TableHeader({ className = '', ...props }: TableHeaderProps) {
  return (
    <th
      className={`px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider ${className}`}
      {...props}
    />
  );
}

export function TableCell({ className = '', ...props }: TableCellProps) {
  return <td className={`px-4 py-3 text-sm ${className}`} {...props} />;
}
