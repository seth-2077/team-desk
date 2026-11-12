import { createFileRoute, redirect } from '@tanstack/react-router';
import { memberQuerySchema } from '../features/members';

export const Route = createFileRoute('/')({
  beforeLoad: () =>
    redirect({
      to: '/members',
      search: memberQuerySchema.parse({}),
      throw: true,
    }),
});
