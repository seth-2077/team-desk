import { SelectControl } from '@/components/ui/select-control';
import { SearchInput } from '@/components/ui/search-input';
import { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useSearchParams } from 'react-router';
import { Plus, Ticket as TicketIcon } from 'lucide-react';
import {
  ticketQuerySchema,
  type Ticket,
  type TicketInput,
} from '@/api/tickets/schemas';
import { MemberName } from '@/components/member-name';
import { ApiError, errorMessage } from '@/api/client';
import { Button } from '@/components/ui/button';
import { DataTable, type TableColumn } from '@/components/ui/data-table';
import { ConfirmDelete } from '@/components/ui/confirm-delete';
import { ticketsApi } from '@/api/tickets/requests';
import { ticketsQuery, ticketKeys } from '@/api/tickets/queries';
import { mergeSearchParams } from '@/lib/search-params';
import { TicketForm } from './ticket-form';

const statuses = {
  open: '待处理',
  in_progress: '处理中',
  resolved: '已解决',
  closed: '已关闭',
};
const priorities = { low: '低', medium: '中', high: '高' };
export function TicketsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = ticketQuerySchema.parse(Object.fromEntries(searchParams));
  const client = useQueryClient();
  const query = useQuery(ticketsQuery(search));
  const [editing, setEditing] = useState<Ticket | 'new' | null>(null);
  const [deleting, setDeleting] = useState<Ticket | null>(null);
  function update(patch: Record<string, unknown>) {
    setSearchParams((previous) =>
      mergeSearchParams(previous, ticketQuerySchema, patch),
    );
  }
  const save = useMutation({
    mutationFn: async ({
      input,
      target,
    }: {
      input: TicketInput;
      target: Ticket | 'new';
    }) => {
      if (target === 'new') return ticketsApi.create(input);
      try {
        return await ticketsApi.update(target.id, {
          ...input,
          version: target.version,
        });
      } catch (error) {
        if (error instanceof ApiError && error.body.code === 'VERSION_CONFLICT')
          await client.invalidateQueries({ queryKey: ticketKeys.all });
        throw error;
      }
    },
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ticketKeys.all });
    },
  });
  const remove = useMutation({
    mutationFn: (id: string) => ticketsApi.remove(id),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ticketKeys.all });
      setDeleting(null);
      if (query.data?.items.length === 1 && search.page > 1)
        update({ page: search.page - 1 });
    },
  });
  const columns: TableColumn<Ticket>[] = [
    {
      accessorKey: 'title',
      header: '工单',
      cell: ({ row }) => (
        <div className="max-w-72">
          <p className="font-medium">{row.original.title}</p>
          <p className="mt-1 text-xs text-slate-400">
            {row.original.id.toUpperCase()} ·{' '}
            {row.original.type === 'incident' ? '故障工单' : '普通工单'}
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: '状态',
      cell: ({ row }) => (
        <span className="rounded-md bg-blue-50 px-2 py-1 text-xs text-blue-700">
          {statuses[row.original.status]}
        </span>
      ),
    },
    {
      accessorKey: 'priority',
      header: '优先级',
      cell: ({ row }) => priorities[row.original.priority],
    },
    {
      accessorKey: 'assigneeId',
      header: '负责人',
      cell: ({ row }) => <MemberName id={row.original.assigneeId} />,
    },
    {
      accessorKey: 'dueAt',
      header: '截止时间',
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-xs text-slate-500">
          {row.original.dueAt.replace('T', ' ').slice(0, 16)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '操作',
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Button variant="ghost" onClick={() => setEditing(row.original)}>
            编辑
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              remove.reset();
              setDeleting(row.original);
            }}
          >
            删除
          </Button>
        </div>
      ),
    },
  ];
  return (
    <section>
      <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-blue-600">
            <TicketIcon size={14} /> Workspace / Tickets
          </div>
          <h1 className="text-3xl font-semibold">工单管理</h1>
          <p className="mt-2 text-sm text-slate-500">
            从待办到完成，让每一项工作都有清晰的进展。
          </p>
        </div>
        <Button onClick={() => setEditing('new')}>
          <Plus data-icon="inline-start" />
          新增工单
        </Button>
      </div>
      <div className="mb-5 flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <SearchInput
          aria-label="搜索工单"
          className="max-w-64"
          placeholder="搜索标题或描述…"
          value={search.q}
          onValueChange={(q) => update({ q })}
        />
        <SelectControl
          aria-label="工单状态筛选"
          className="max-w-36"
          value={search.status}
          onValueChange={(value) => update({ status: value })}
          options={[
            { value: '', label: '全部状态' },
            ...Object.entries(statuses).map(([value, label]) => ({
              value,
              label,
            })),
          ]}
        />
        <SelectControl
          aria-label="优先级筛选"
          className="max-w-36"
          value={search.priority}
          onValueChange={(value) => update({ priority: value })}
          options={[
            { value: '', label: '全部优先级' },
            ...Object.entries(priorities).map(([value, label]) => ({
              value,
              label,
            })),
          ]}
        />
        <SelectControl
          aria-label="排序字段"
          className="max-w-36"
          value={search.sort}
          onValueChange={(value) => update({ sort: value })}
          options={[
            { value: 'title', label: '按标题排序' },
            { value: 'status', label: '按状态排序' },
            { value: 'priority', label: '按优先级排序' },
          ]}
        />
        <Button
          variant="outline"
          onClick={() =>
            update({ direction: search.direction === 'asc' ? 'desc' : 'asc' })
          }
        >
          {search.direction === 'asc' ? '↑ 升序' : '↓ 降序'}
        </Button>
        <SelectControl
          aria-label="每页条数"
          className="max-w-28"
          value={search.pageSize}
          onValueChange={(value) => update({ pageSize: value })}
          options={[
            { value: '5', label: '5 条 / 页' },
            { value: '10', label: '10 条 / 页' },
            { value: '20', label: '20 条 / 页' },
          ]}
        />
      </div>
      <DataTable
        columns={columns}
        result={query.data}
        loading={query.isFetching}
        error={query.error ? errorMessage(query.error) : undefined}
        onRetry={() => {
          void query.refetch();
        }}
        onPage={(page) => update({ page })}
      />
      {editing && (
        <TicketForm
          key={editing === 'new' ? 'new' : editing.id}
          ticket={editing === 'new' ? undefined : editing}
          onClose={() => setEditing(null)}
          onSave={async (input) => {
            await save.mutateAsync({ input, target: editing });
          }}
        />
      )}
      {deleting && (
        <ConfirmDelete
          name={deleting.title}
          busy={remove.isPending}
          error={remove.error ? errorMessage(remove.error) : undefined}
          onClose={() => setDeleting(null)}
          onConfirm={() => {
            if (!remove.isPending) remove.mutate(deleting.id);
          }}
        />
      )}
    </section>
  );
}
