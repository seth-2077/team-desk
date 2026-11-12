import { queryOptions } from '@tanstack/react-query';
import { pageSchema } from '../../shared/api-types';
import {
  ticketSchema,
  type TicketInput,
  type TicketUpdate,
  type TicketQuery,
} from './schema';
import { request, queryString, emptyResponse } from '../../shared/api';

export const ticketKeys = { all: ['tickets'] as const };
export const ticketsApi = {
  list: (query: TicketQuery, signal?: AbortSignal) =>
    request('/tickets?' + queryString(query), pageSchema(ticketSchema), {
      signal,
    }),
  create: (input: TicketInput) =>
    request('/tickets', ticketSchema, {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  update: (id: string, input: TicketUpdate) =>
    request('/tickets/' + encodeURIComponent(id), ticketSchema, {
      method: 'PUT',
      body: JSON.stringify(input),
    }),
  remove: (id: string) =>
    request('/tickets/' + encodeURIComponent(id), emptyResponse, {
      method: 'DELETE',
    }),
};
export const ticketsQuery = (query: TicketQuery) =>
  queryOptions({
    queryKey: [...ticketKeys.all, 'list', query],
    queryFn: ({ signal }) => ticketsApi.list(query, signal),
  });
