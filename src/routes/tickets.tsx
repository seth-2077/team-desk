import { createFileRoute } from '@tanstack/react-router';
import { TicketsPage, ticketQuerySchema } from '../features/tickets';
import { ticketsQuery } from '../features/tickets/api';

export const Route = createFileRoute('/tickets')({
  validateSearch: (search) => ticketQuerySchema.parse(search),
  loaderDeps: ({ search }) => search,
  loader: async ({ deps, context: { queryClient } }) => {
    await queryClient.ensureQueryData(ticketsQuery(deps));
  },
  component: TicketsPage,
});
