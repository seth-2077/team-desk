import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from './table';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table';
import { type Page } from '../api-types';
import { Button } from './button';

export function DataTable<T>({
  columns,
  result,
  loading,
  error,
  onRetry,
  onPage,
}: {
  columns: ColumnDef<T>[];
  result?: Page<T>;
  loading: boolean;
  error?: string;
  onRetry: () => void;
  onPage: (page: number) => void;
}) {
  const table = useReactTable({
    columns,
    data: result?.items ?? [],
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
  });
  if (error)
    return (
      <div
        role="alert"
        className="rounded-lg border border-red-200 bg-white p-10 text-center"
      >
        <p>{error}</p>
        <Button variant="outline" onClick={onRetry}>
          重试
        </Button>
      </div>
    );
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <Table
          className="min-w-[850px] w-full text-left text-sm"
          aria-busy={loading}
        >
          <TableHeader className="border-b border-slate-200 bg-slate-50/80 text-xs text-slate-500">
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id}>
                {group.headers.map((header) => (
                  <TableHead key={header.id} className="px-5 py-4 font-medium">
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody className="divide-y divide-slate-100">
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} className="hover:bg-slate-50/70">
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className="px-5 py-4 whitespace-normal"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {loading ? (
        <p role="status" className="p-10 text-center text-slate-500">
          加载中…
        </p>
      ) : (
        !result?.items.length && (
          <p className="p-12 text-center text-slate-500">
            没有匹配的数据，试试调整筛选或新增记录。
          </p>
        )
      )}
      <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
        <span>共 {result?.total ?? 0} 条记录</span>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            disabled={loading || !result || result.page <= 1}
            onClick={() => onPage((result?.page ?? 1) - 1)}
          >
            上一页
          </Button>
          <span>
            第 {result?.page ?? 1} /{' '}
            {Math.max(
              1,
              Math.ceil((result?.total ?? 0) / (result?.pageSize ?? 10)),
            )}{' '}
            页
          </span>
          <Button
            variant="outline"
            disabled={
              loading ||
              !result ||
              result.page * result.pageSize >= result.total
            }
            onClick={() => onPage((result?.page ?? 1) + 1)}
          >
            下一页
          </Button>
        </div>
      </div>
    </div>
  );
}
