import { queryOptions } from '@tanstack/react-query';
import { memberSchema, type MemberInput, type MemberQuery } from './schema';
import { pageSchema } from '../../shared/api-types';
import { emptyResponse, queryString, request } from '../../shared/api';

export const membersApi = {
  list: (query: MemberQuery, signal?: AbortSignal) =>
    request('/members?' + queryString(query), pageSchema(memberSchema), {
      signal,
    }),
  get: (id: string, signal?: AbortSignal) =>
    request('/members/' + encodeURIComponent(id), memberSchema, { signal }),
  create: (input: MemberInput) =>
    request('/members', memberSchema, {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  update: (id: string, input: MemberInput) =>
    request('/members/' + encodeURIComponent(id), memberSchema, {
      method: 'PUT',
      body: JSON.stringify(input),
    }),
  remove: (id: string) =>
    request('/members/' + encodeURIComponent(id), emptyResponse, {
      method: 'DELETE',
    }),
};
export const memberKeys = { all: ['members'] as const };
export const membersQuery = (query: MemberQuery) =>
  queryOptions({
    queryKey: [...memberKeys.all, 'list', query],
    queryFn: ({ signal }) => membersApi.list(query, signal),
  });
export const memberQuery = (id: string) =>
  queryOptions({
    queryKey: [...memberKeys.all, 'detail', id],
    queryFn: ({ signal }) => membersApi.get(id, signal),
  });
