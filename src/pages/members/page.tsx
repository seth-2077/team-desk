import { SelectControl } from '@/components/ui/select-control';
import { SearchInput } from '@/components/ui/search-input';
import { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useSearchParams } from 'react-router';
import { Plus, Users } from 'lucide-react';
import {
  memberQuerySchema,
  type Member,
  type MemberInput,
  type MemberQuery,
} from '@/api/members/schemas';
import { errorMessage } from '@/api/client';
import { Button } from '@/components/ui/button';
import { DataTable, type TableColumn } from '@/components/ui/data-table';
import { ConfirmDelete } from '@/components/ui/confirm-delete';
import { membersApi } from '@/api/members/requests';
import { membersQuery, memberKeys } from '@/api/members/queries';
import { mergeSearchParams } from '@/lib/search-params';
import { MemberForm } from './member-form';

const roles = { admin: '管理员', agent: '协作成员', viewer: '观察者' };
export function MembersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = memberQuerySchema.parse(Object.fromEntries(searchParams));
  const client = useQueryClient();
  const query = useQuery(membersQuery(search));
  const [editing, setEditing] = useState<Member | 'new' | null>(null);
  const [deleting, setDeleting] = useState<Member | null>(null);
  function update(patch: Partial<MemberQuery>) {
    setSearchParams((previous) =>
      mergeSearchParams(previous, memberQuerySchema, patch),
    );
  }
  const save = useMutation({
    mutationFn: ({
      input,
      target,
    }: {
      input: MemberInput;
      target: Member | 'new';
    }) =>
      target === 'new'
        ? membersApi.create(input)
        : membersApi.update(target.id, input),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: memberKeys.all });
    },
  });
  const remove = useMutation({
    mutationFn: (id: string) => membersApi.remove(id),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: memberKeys.all });
      setDeleting(null);
      if (query.data?.items.length === 1 && search.page > 1)
        update({ page: search.page - 1 });
    },
  });
  const columns: TableColumn<Member>[] = [
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
        <SearchInput
          aria-label="搜索成员"
          className="max-w-64"
          placeholder="搜索姓名或邮箱…"
          value={search.q}
          onValueChange={(q) => update({ q })}
        />
        <SelectControl
          aria-label="角色筛选"
          className="max-w-36"
          value={search.role}
          onValueChange={(value) => {
            const role = value;
            if (
              role === '' ||
              role === 'admin' ||
              role === 'agent' ||
              role === 'viewer'
            )
              update({ role });
          }}
          options={[
            { value: '', label: '全部角色' },
            { value: 'admin', label: '管理员' },
            { value: 'agent', label: '协作成员' },
            { value: 'viewer', label: '观察者' },
          ]}
        />
        <SelectControl
          aria-label="状态筛选"
          className="max-w-36"
          value={search.status}
          onValueChange={(value) => {
            const status = value;
            if (status === '' || status === 'active' || status === 'inactive')
              update({ status });
          }}
          options={[
            { value: '', label: '全部状态' },
            { value: 'active', label: '启用' },
            { value: 'inactive', label: '停用' },
          ]}
        />
        <SelectControl
          aria-label="排序字段"
          className="max-w-36"
          value={search.sort}
          onValueChange={(value) => {
            const sort = value;
            if (sort === 'name' || sort === 'email' || sort === 'status')
              update({ sort });
          }}
          options={[
            { value: 'name', label: '按姓名排序' },
            { value: 'email', label: '按邮箱排序' },
            { value: 'status', label: '按状态排序' },
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
          onValueChange={(value) => {
            const n = Number(value);
            if (n === 5 || n === 10 || n === 20) update({ pageSize: n });
          }}
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
        <MemberForm
          key={editing === 'new' ? 'new' : editing.id}
          member={editing === 'new' ? undefined : editing}
          onClose={() => setEditing(null)}
          onSave={async (input) => {
            await save.mutateAsync({ input, target: editing });
          }}
        />
      )}
      {deleting && (
        <ConfirmDelete
          name={deleting.name}
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
