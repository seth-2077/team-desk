import { useQuery } from '@tanstack/react-query';
import { memberQuery } from '@/api/members/queries';

export function MemberName({ id }: { id: string }) {
  const query = useQuery(memberQuery(id));
  if (query.isPending) return <span className="text-slate-400">加载中…</span>;
  if (query.isError)
    return (
      <button
        type="button"
        className="text-red-600"
        onClick={() => {
          void query.refetch();
        }}
      >
        负责人加载失败，重试
      </button>
    );
  return (
    <span>
      {query.data.name}
      {query.data.status === 'inactive' && (
        <span className="ml-1 text-xs text-slate-400">（已停用）</span>
      )}
    </span>
  );
}
