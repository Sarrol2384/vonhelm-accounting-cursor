import { cn } from './utils';

export interface Column {
  key: string;
  header: string;
  render?: (row: Record<string, unknown>) => React.ReactNode;
  className?: string;
  sortable?: boolean;
}

export type DataRow = Record<string, unknown> & { id: string };

export function DataTable({
  columns,
  data,
  onRowClick,
  emptyMessage = 'No records found',
  className,
  compact = false,
}: {
  columns: Column[];
  data: DataRow[];
  onRowClick?: (row: DataRow) => void;
  emptyMessage?: string;
  className?: string;
  compact?: boolean;
}) {
  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-10 text-center text-sm text-slate-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={cn('overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm', className)}>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'whitespace-nowrap px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500',
                    compact ? 'py-2.5' : 'py-3',
                    col.className,
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {data.map((row, idx) => (
              <tr
                key={row.id}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  'transition-colors',
                  idx % 2 === 1 && 'bg-slate-50/30',
                  onRowClick && 'cursor-pointer hover:bg-teal-50/50',
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      'whitespace-nowrap px-4 text-slate-700',
                      compact ? 'py-2.5' : 'py-3.5',
                      col.className,
                    )}
                  >
                    {col.render ? col.render(row) : (row[col.key] as React.ReactNode)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
