import { pageSchema } from '../types';
import {
  ticketSchema,
  type TicketInput,
  type TicketUpdate,
  type TicketQuery,
} from './schemas';
import { request, queryString, emptyResponse } from '../client';

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
