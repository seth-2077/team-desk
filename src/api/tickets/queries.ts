import { queryOptions } from '@tanstack/react-query';
import type { TicketQuery } from './schemas';
import { ticketsApi } from './requests';

export const ticketKeys = {
  all: ['tickets'] as const,
  lists: () => [...ticketKeys.all, 'list'] as const,
  list: (query: TicketQuery) => [...ticketKeys.lists(), query] as const,
};
export const ticketsQuery = (query: TicketQuery) =>
  queryOptions({
    queryKey: ticketKeys.list(query),
    queryFn: ({ signal }) => ticketsApi.list(query, signal),
  });
