import { queryOptions } from '@tanstack/react-query';
import type { MemberQuery } from './schemas';
import { membersApi } from './requests';

export const memberKeys = {
  all: ['members'] as const,
  lists: () => [...memberKeys.all, 'list'] as const,
  list: (query: MemberQuery) => [...memberKeys.lists(), query] as const,
  details: () => [...memberKeys.all, 'detail'] as const,
  detail: (id: string) => [...memberKeys.details(), id] as const,
};
export const membersQuery = (query: MemberQuery) =>
  queryOptions({
    queryKey: memberKeys.list(query),
    queryFn: ({ signal }) => membersApi.list(query, signal),
  });
export const memberQuery = (id: string) =>
  queryOptions({
    queryKey: memberKeys.detail(id),
    queryFn: ({ signal }) => membersApi.get(id, signal),
  });
