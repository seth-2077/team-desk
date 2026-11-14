import { useState, type Ref } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SearchSelect } from '@/components/ui/search-select';
import { memberQuery, membersQuery } from '@/api/members/queries';
import { memberQuerySchema } from '@/api/members/schemas';

export function AssigneeSelect({
  id = 'assigneeId',
  value,
  onChange,
  historicalId,
  error,
  selectRef,
  onBlur,
  disabled,
}: {
  id?: string;
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
    <SearchSelect
      id={id}
      value={value}
      onChange={onChange}
      options={items}
      search={search}
      onSearchChange={setSearch}
      searchLabel="搜索负责人"
      searchPlaceholder="输入姓名或邮箱搜索负责人…"
      loading={members.isFetching}
      errorText={members.isError ? '负责人加载失败' : undefined}
      error={error}
      selectRef={selectRef}
      onBlur={onBlur}
      disabled={disabled}
    />
  );
}
