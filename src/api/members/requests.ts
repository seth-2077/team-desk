import { memberSchema, type MemberInput, type MemberQuery } from './schemas';
import { pageSchema } from '../types';
import { emptyResponse, queryString, request } from '../client';

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
