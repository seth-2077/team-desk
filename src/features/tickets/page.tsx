import { Input } from '../../shared/ui/input';
import { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useNavigate, useSearch } from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';
import { Plus, Ticket as TicketIcon } from 'lucide-react';
import { ticketQuerySchema, type Ticket, type TicketInput } from './schema';
import { MemberName } from '../members';
import { ApiError, errorMessage } from '../../shared/api';
import { Button } from '../../shared/ui/button';
import { DataTable } from '../../shared/ui/data-table';
import { ConfirmDelete } from '../../shared/ui/confirm-delete';
import { ticketsApi, ticketsQuery, ticketKeys } from './api';
import { TicketForm } from './ticket-form';

const statuses = {
  open: '待处理',
  in_progress: '处理中',
  resolved: '已解决',
  closed: '已关闭',
};
const priorities = { low: '低', medium: '中', high: '高' };
export function TicketsPage() {
  const search = useSearch({ from: '/tickets' });
  const navigate = useNavigate({ from: '/tickets' });
  const client = useQueryClient();
  const query = useQuery(ticketsQuery(search));
  const [editing, setEditing] = useState<Ticket | 'new' | null>(null);
  const [deleting, setDeleting] = useState<Ticket | null>(null);
  function update(patch: Record<string, unknown>) {
    void navigate({
      search: (previous) =>
        ticketQuerySchema.parse({ ...previous, page: 1, ...patch }),
    });
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
  const columns: ColumnDef<Ticket>[] = [
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
        <Input
          aria-label="搜索工单"
          className="max-w-64"
          placeholder="搜索标题或描述…"
          value={search.q}
          onChange={(e) => update({ q: e.target.value })}
        />
        <select
          aria-label="工单状态筛选"
          className="max-w-36"
          value={search.status}
          onChange={(e) => update({ status: e.target.value })}
        >
          <option value="">全部状态</option>
          {Object.entries(statuses).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        <select
          aria-label="优先级筛选"
          className="max-w-36"
          value={search.priority}
          onChange={(e) => update({ priority: e.target.value })}
        >
          <option value="">全部优先级</option>
          {Object.entries(priorities).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        <select
          aria-label="排序字段"
          className="max-w-36"
          value={search.sort}
          onChange={(e) => update({ sort: e.target.value })}
        >
          <option value="title">按标题排序</option>
          <option value="status">按状态排序</option>
          <option value="priority">按优先级排序</option>
        </select>
        <Button
          variant="outline"
          onClick={() =>
            update({ direction: search.direction === 'asc' ? 'desc' : 'asc' })
          }
        >
          {search.direction === 'asc' ? '↑ 升序' : '↓ 降序'}
        </Button>
        <select
          aria-label="每页条数"
          className="max-w-28"
          value={search.pageSize}
          onChange={(e) => update({ pageSize: e.target.value })}
        >
          <option value="5">5 条 / 页</option>
          <option value="10">10 条 / 页</option>
          <option value="20">20 条 / 页</option>
        </select>
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
