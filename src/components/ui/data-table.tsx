import {
  rowPaginationFeature,
  tableFeatures,
  useTable,
  type ColumnDef,
  type PaginationState,
  type RowData,
} from '@tanstack/react-table';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from './table';
import { type Page } from '@/api/types';
import { Button } from './button';

/**
 * 表格的静态特性集，只在模块作用域声明一次。
 *
 * 产品的筛选、排序、分页全部由服务端完成，客户端不再重复处理数据，因此：
 * - 只注册 rowPaginationFeature：需要它的分页状态与翻页 API；
 * - 不注册任何 create*RowModel 槽位（createFilteredRowModel 等），行模型保持 core；
 * - 不注册 filterFns / sortFns 注册表，列定义里也没有对应的处理函数。
 * 将来需要客户端处理时，在同一个 tableFeatures 调用里按顺序追加特性与槽位，
 * 例如 tableFeatures({ rowPaginationFeature, rowSortingFeature, sortedRowModel: createSortedRowModel() })。
 */
const features = tableFeatures({ rowPaginationFeature });

/** 列定义绑定到该特性集：未注册的特性不会出现在类型里。 */
export type TableColumn<T extends RowData> = ColumnDef<typeof features, T>;

/** 稳定的空数组，避免每次渲染生成新引用导致行模型失效。 */
const EMPTY_ROWS: never[] = [];

export function DataTable<T extends RowData>({
  columns,
  result,
  loading,
  error,
  onRetry,
  onPage,
}: {
  columns: TableColumn<T>[];
  result?: Page<T>;
  loading: boolean;
  error?: string;
  onRetry: () => void;
  onPage: (page: number) => void;
}) {
  const pagination: PaginationState = {
    pageIndex: Math.max(0, (result?.page ?? 1) - 1),
    pageSize: result?.pageSize ?? 10,
  };

  const table = useTable(
    {
      features,
      columns,
      data: result?.items ?? EMPTY_ROWS,
      rowCount: result?.total ?? 0,
      manualPagination: true,
      // 页码的唯一来源是 URL，这里只做受控同步，不在表格内部再存一份。
      state: { pagination },
      onPaginationChange: (updater) => {
        const next =
          typeof updater === 'function' ? updater(pagination) : updater;
        if (next.pageIndex !== pagination.pageIndex) onPage(next.pageIndex + 1);
      },
    },
    // 只订阅分页切片：数据由 props 驱动，不需要为其他状态重新渲染。
    (state) => ({ pagination: state.pagination }),
  );

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
                  <TableHead
                    key={header.id}
                    scope="col"
                    className="px-5 py-4 font-medium"
                  >
                    {header.isPlaceholder ? null : (
                      <table.FlexRender header={header} />
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody className="divide-y divide-slate-100">
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} className="hover:bg-slate-50/70">
                {row.getAllCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className="px-5 py-4 whitespace-normal"
                  >
                    <table.FlexRender cell={cell} />
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
        <span>共 {table.getRowCount()} 条记录</span>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            disabled={loading || !table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
          >
            上一页
          </Button>
          <span>
            第 {table.state.pagination.pageIndex + 1} /{' '}
            {Math.max(1, table.getPageCount())} 页
          </span>
          <Button
            variant="outline"
            disabled={loading || !table.getCanNextPage()}
            onClick={() => table.nextPage()}
          >
            下一页
          </Button>
        </div>
      </div>
    </div>
  );
}
