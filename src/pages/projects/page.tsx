import { SelectControl } from '@/components/ui/select-control';
import { SearchInput } from '@/components/ui/search-input';
import { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useSearchParams } from 'react-router';
import { FolderKanban, Plus } from 'lucide-react';
import {
  projectQuerySchema,
  type Project,
  type ProjectInput,
  type ProjectQuery,
} from '@/api/projects/schemas';
import { MemberName } from '@/components/member-name';
import { errorMessage } from '@/api/client';
import { Button } from '@/components/ui/button';
import { DataTable, type TableColumn } from '@/components/ui/data-table';
import { projectsApi } from '@/api/projects/requests';
import { projectsQuery, projectKeys } from '@/api/projects/queries';
import { mergeSearchParams } from '@/lib/search-params';
import { ProjectForm } from './project-form';

const statusLabels = { in_progress: '进行中', archived: '已归档' };
export function ProjectsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = projectQuerySchema.parse(Object.fromEntries(searchParams));
  const client = useQueryClient();
  const query = useQuery(projectsQuery(search));
  const [editing, setEditing] = useState<Project | 'new' | null>(null);
  function update(patch: Partial<ProjectQuery>) {
    setSearchParams((previous) =>
      mergeSearchParams(previous, projectQuerySchema, patch),
    );
  }
  const save = useMutation({
    mutationFn: ({
      input,
      target,
    }: {
      input: ProjectInput;
      target: Project | 'new';
    }) =>
      target === 'new'
        ? projectsApi.create(input)
        : projectsApi.update(target.id, input),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
  const columns: TableColumn<Project>[] = [
    {
      accessorKey: 'name',
      header: '项目',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <FolderKanban size={18} />
          </span>
          <span className="font-medium">{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: 'code',
      header: '编号',
      cell: ({ row }) => (
        <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs text-slate-600">
          {row.original.code}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: '状态',
      cell: ({ row }) => (
        <span
          className={
            row.original.status === 'in_progress'
              ? 'rounded-full bg-emerald-50 px-2 py-1 text-xs text-emerald-700'
              : 'rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-500'
          }
        >
          {row.original.status === 'in_progress'
            ? '● ' + statusLabels.in_progress
            : '● ' + statusLabels.archived}
        </span>
      ),
    },
    {
      accessorKey: 'ownerId',
      header: '负责人',
      cell: ({ row }) => <MemberName id={row.original.ownerId} />,
    },
    {
      id: 'actions',
      header: '操作',
      cell: ({ row }) => (
        <Button variant="ghost" onClick={() => setEditing(row.original)}>
          编辑
        </Button>
      ),
    },
  ];
  return (
    <section>
      <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-blue-600">
            <FolderKanban size={14} /> Workspace / Projects
          </div>
          <h1 className="text-3xl font-semibold">项目管理</h1>
          <p className="mt-2 text-sm text-slate-500">
            登记团队项目，跟踪进度与负责人；归档后锁定负责人。
          </p>
        </div>
        <Button onClick={() => setEditing('new')}>
          <Plus size={16} />
          新增项目
        </Button>
      </div>
      <div className="mb-5 flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <SearchInput
          aria-label="搜索项目"
          className="max-w-64"
          placeholder="搜索项目名称或编号…"
          value={search.q}
          onValueChange={(q) => update({ q })}
        />
        <SelectControl
          aria-label="项目状态筛选"
          className="max-w-36"
          value={search.status}
          onValueChange={(value) => {
            if (value === '' || value === 'in_progress' || value === 'archived')
              update({ status: value });
          }}
          options={[
            { value: '', label: '全部状态' },
            ...Object.entries(statusLabels).map(([value, label]) => ({
              value,
              label,
            })),
          ]}
        />
        <SelectControl
          aria-label="排序字段"
          className="max-w-36"
          value={search.sort}
          onValueChange={(value) => {
            if (value === 'name' || value === 'code' || value === 'status')
              update({ sort: value });
          }}
          options={[
            { value: 'name', label: '按名称排序' },
            { value: 'code', label: '按编号排序' },
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
        <ProjectForm
          key={editing === 'new' ? 'new' : editing.id}
          project={editing === 'new' ? undefined : editing}
          onClose={() => setEditing(null)}
          onSave={async (input) => {
            await save.mutateAsync({ input, target: editing });
          }}
        />
      )}
    </section>
  );
}
