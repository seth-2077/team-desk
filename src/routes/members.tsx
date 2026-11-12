import { createFileRoute } from '@tanstack/react-router';
import { MembersPage, memberQuerySchema } from '../features/members';

export const Route = createFileRoute('/members')({
  validateSearch: (search) => memberQuerySchema.parse(search),
  component: MembersPage,
});
