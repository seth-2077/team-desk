import { Input } from '../../shared/ui/input';
import { useState, type Ref } from 'react';
import { useQuery } from '@tanstack/react-query';
import { memberQuery, membersQuery } from './api';
import { memberQuerySchema } from './schema';

export function AssigneeSelect({
  value,
  onChange,
  historicalId,
  error,
  selectRef,
  onBlur,
}: {
  value: string;
  onChange: (id: string) => void;
  historicalId?: string;
  error?: string;
  selectRef?: Ref<HTMLSelectElement>;
  onBlur?: () => void;
}) {
  const [search, setSearch] = useState('');
  const members = useQuery(
    membersQuery(
      memberQuerySchema.parse({ q: search, status: 'active', pageSize: 20 }),
    ),
  );
  const historical = useQuery({
    ...memberQuery(historicalId ?? ''),
    enabled: !!historicalId,
  });
  const selected = useQuery({ ...memberQuery(value), enabled: !!value });
  const options = members.data?.items ?? [];
  const previous = selected.data ?? historical.data;
  return (
    <div className="flex flex-col gap-2">
      <Input
        aria-label="搜索负责人"
        placeholder="输入姓名或邮箱搜索负责人…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <select
        id="assigneeId"
        ref={selectRef}
        onBlur={onBlur}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
        aria-describedby={
          error
            ? 'assigneeId-description assigneeId-error'
            : 'assigneeId-description'
        }
      >
        <option value="">请选择负责人</option>
        {previous &&
          (previous.status === 'active' || previous.id === historicalId) &&
          !options.some((m) => m.id === previous.id) && (
            <option value={previous.id}>
              {previous.name}
              {previous.status === 'inactive'
                ? '（已停用，历史负责人）'
                : '（当前负责人）'}
            </option>
          )}
        {options.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name} · {m.email}
          </option>
        ))}
      </select>
      {members.isFetching && (
        <p role="status" className="text-xs text-slate-500">
          搜索中…
        </p>
      )}
      {members.isError && (
        <p role="alert" className="text-xs text-red-600">
          负责人加载失败
        </p>
      )}
    </div>
  );
}
