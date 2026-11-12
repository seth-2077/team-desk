import { createFileRoute } from '@tanstack/react-router';
import { MembersPage, memberQuerySchema } from '../features/members';
import { membersQuery } from '../features/members/api';

export const Route = createFileRoute('/members')({
  validateSearch: (search) => memberQuerySchema.parse(search),
  loaderDeps: ({ search }) => search,
  loader: async ({ deps, context: { queryClient } }) => {
    await queryClient.ensureQueryData(membersQuery(deps));
  },
  component: MembersPage,
});
