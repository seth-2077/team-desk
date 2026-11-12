import { Input } from '../../shared/ui/input';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearch } from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';
import { Plus, Users } from 'lucide-react';
import { type Member, type MemberQuery } from './schema';
import { errorMessage } from '../../shared/api';
import { Button } from '../../shared/ui/button';
import { DataTable } from '../../shared/ui/data-table';
import { ConfirmDelete } from '../../shared/ui/confirm-delete';
import { membersApi, membersQuery, memberKeys } from './api';
import { MemberForm } from './member-form';

const roles = { admin: '管理员', agent: '协作成员', viewer: '观察者' };
export function MembersPage() {
  const search = useSearch({ from: '/members' });
  const navigate = useNavigate({ from: '/members' });
  const client = useQueryClient();
  const query = useQuery(membersQuery(search));
  const [editing, setEditing] = useState<Member | 'new' | null>(null);
  const [deleting, setDeleting] = useState<Member | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string>();
  function update(patch: Partial<MemberQuery>) {
    void navigate({
      search: (previous) => ({ ...previous, page: 1, ...patch }),
    });
  }
  const columns: ColumnDef<Member>[] = [
    {
      accessorKey: 'name',
      header: '成员',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 font-semibold text-blue-600">
            {row.original.name.slice(0, 1)}
          </span>
          <span className="font-medium">{row.original.name}</span>
        </div>
      ),
    },
    { accessorKey: 'email', header: '邮箱' },
    {
      accessorKey: 'role',
      header: '角色',
      cell: ({ row }) => roles[row.original.role],
    },
    {
      accessorKey: 'status',
      header: '状态',
      cell: ({ row }) => (
        <span
          className={
            row.original.status === 'active'
              ? 'rounded-full bg-emerald-50 px-2 py-1 text-xs text-emerald-700'
              : 'rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-500'
          }
        >
          {row.original.status === 'active' ? '● 启用' : '● 停用'}
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
              setDeleting(row.original);
              setDeleteError(undefined);
            }}
          >
            删除
          </Button>
        </div>
      ),
    },
  ];
  async function remove() {
    if (!deleting || deleteBusy) return;
    setDeleteBusy(true);
    try {
      await membersApi.remove(deleting.id);
      await client.invalidateQueries({ queryKey: memberKeys.all });
      setDeleting(null);
      if (query.data?.items.length === 1 && search.page > 1)
        update({ page: search.page - 1 });
    } catch (error) {
      setDeleteError(errorMessage(error));
    } finally {
      setDeleteBusy(false);
    }
  }
  return (
    <section>
      <div className="mb-7 flex items-center justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-blue-600">
            <Users size={14} /> Workspace / Members
          </div>
          <h1 className="text-3xl font-semibold">成员管理</h1>
          <p className="mt-2 text-sm text-slate-500">
            管理团队成员，让每一项工作找到合适的人。
          </p>
        </div>
        <Button onClick={() => setEditing('new')}>
          <Plus size={16} />
          新增成员
        </Button>
      </div>
      <div className="mb-5 flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <Input
          aria-label="搜索成员"
          className="max-w-64"
          placeholder="搜索姓名或邮箱…"
          value={search.q}
          onChange={(e) => update({ q: e.target.value })}
        />
        <select
          aria-label="角色筛选"
          className="max-w-36"
          value={search.role}
          onChange={(e) => {
            const role = e.target.value;
            if (
              role === '' ||
              role === 'admin' ||
              role === 'agent' ||
              role === 'viewer'
            )
              update({ role });
          }}
        >
          <option value="">全部角色</option>
          <option value="admin">管理员</option>
          <option value="agent">协作成员</option>
          <option value="viewer">观察者</option>
        </select>
        <select
          aria-label="状态筛选"
          className="max-w-36"
          value={search.status}
          onChange={(e) => {
            const status = e.target.value;
            if (status === '' || status === 'active' || status === 'inactive')
              update({ status });
          }}
        >
          <option value="">全部状态</option>
          <option value="active">启用</option>
          <option value="inactive">停用</option>
        </select>
        <select
          aria-label="排序字段"
          className="max-w-36"
          value={search.sort}
          onChange={(e) => {
            const sort = e.target.value;
            if (sort === 'name' || sort === 'email' || sort === 'status')
              update({ sort });
          }}
        >
          <option value="name">按姓名排序</option>
          <option value="email">按邮箱排序</option>
          <option value="status">按状态排序</option>
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
          onChange={(e) => {
            const n = Number(e.target.value);
            if (n === 5 || n === 10 || n === 20) update({ pageSize: n });
          }}
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
        <MemberForm
          key={editing === 'new' ? 'new' : editing.id}
          member={editing === 'new' ? undefined : editing}
          onClose={() => setEditing(null)}
          onSave={async (input) => {
            if (editing === 'new') await membersApi.create(input);
            else await membersApi.update(editing.id, input);
            await client.invalidateQueries({ queryKey: memberKeys.all });
          }}
        />
      )}
      {deleting && (
        <ConfirmDelete
          name={deleting.name}
          busy={deleteBusy}
          error={deleteError}
          onClose={() => setDeleting(null)}
          onConfirm={() => {
            void remove();
          }}
        />
      )}
    </section>
  );
}
