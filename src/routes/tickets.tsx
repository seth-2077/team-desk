import { createFileRoute } from '@tanstack/react-router';
import { TicketsPage, ticketQuerySchema } from '../features/tickets';

export const Route = createFileRoute('/tickets')({
  validateSearch: (search) => ticketQuerySchema.parse(search),
  component: TicketsPage,
});
