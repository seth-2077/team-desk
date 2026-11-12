import { SelectControl } from '../../../shared/ui/select-control';
import { Input } from '../../../shared/ui/input';
import { useState, type Ref } from 'react';
import { useQuery } from '@tanstack/react-query';
import { memberQuery, membersQuery } from '../api';
import { memberQuerySchema } from '../schema';

export function AssigneeSelect({
  value,
  onChange,
  historicalId,
  error,
  selectRef,
  onBlur,
  disabled,
}: {
  value: string;
  onChange: (id: string) => void;
  historicalId?: string;
  error?: string;
  selectRef?: Ref<HTMLButtonElement>;
  onBlur?: () => void;
  disabled?: boolean;
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
  const items = [
    { value: '', label: '请选择负责人' },
    ...(previous &&
    (previous.status === 'active' || previous.id === historicalId) &&
    !options.some((m) => m.id === previous.id)
      ? [
          {
            value: previous.id,
            label:
              previous.name +
              (previous.status === 'inactive'
                ? '（已停用，历史负责人）'
                : '（当前负责人）'),
          },
        ]
      : []),
    ...options.map((m) => ({ value: m.id, label: m.name + ' · ' + m.email })),
  ];
  return (
    <div className="flex flex-col gap-2">
      <Input
        aria-label="搜索负责人"
        placeholder="输入姓名或邮箱搜索负责人…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <SelectControl
        id="assigneeId"
        ref={selectRef}
        onBlur={onBlur}
        disabled={disabled}
        value={value}
        onValueChange={onChange}
        options={items}
        aria-invalid={!!error}
        aria-describedby={
          error
            ? 'assigneeId-description assigneeId-error'
            : 'assigneeId-description'
        }
      />
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
