import type { QueryClient } from '@tanstack/react-query';
import { createBrowserRouter, redirect } from 'react-router';
import { memberQuerySchema } from '@/api/members/schemas';
import { membersQuery } from '@/api/members/queries';
import { projectQuerySchema } from '@/api/projects/schemas';
import { projectsQuery } from '@/api/projects/queries';
import { ticketQuerySchema } from '@/api/tickets/schemas';
import { ticketsQuery } from '@/api/tickets/queries';
import { hrefWithSearch } from '@/lib/search-params';
import { AppLayout } from '@/layouts/app-layout';
import { NotFound, RootError } from '@/pages/root';

function searchFrom(request: Request) {
  return Object.fromEntries(new URL(request.url).searchParams);
}

export function createAppRouter(queryClient: QueryClient) {
  return createBrowserRouter([
    {
      path: '/',
      Component: AppLayout,
      ErrorBoundary: RootError,
      loader: ({ request }) => {
        const url = new URL(request.url);
        if (url.pathname !== '/' && url.pathname.endsWith('/')) {
          return redirect(`${url.pathname.replace(/\/+$/, '')}${url.search}`);
        }
        return null;
      },
      children: [
        {
          index: true,
          loader: () =>
            redirect(hrefWithSearch('/members', memberQuerySchema.parse({}))),
        },
        {
          path: 'members',
          loader: async ({ request }) => {
            const search = memberQuerySchema.parse(searchFrom(request));
            await queryClient.query({
              ...membersQuery(search),
              staleTime: 'static',
            });
          },
          lazy: async () => {
            const { MembersPage } = await import('@/pages/members/page');
            return { Component: MembersPage };
          },
        },
        {
          path: 'projects',
          loader: async ({ request }) => {
            const search = projectQuerySchema.parse(searchFrom(request));
            await queryClient.query({
              ...projectsQuery(search),
              staleTime: 'static',
            });
          },
          lazy: async () => {
            const { ProjectsPage } = await import('@/pages/projects/page');
            return { Component: ProjectsPage };
          },
        },
        {
          path: 'tickets',
          loader: async ({ request }) => {
            const search = ticketQuerySchema.parse(searchFrom(request));
            await queryClient.query({
              ...ticketsQuery(search),
              staleTime: 'static',
            });
          },
          lazy: async () => {
            const { TicketsPage } = await import('@/pages/tickets/page');
            return { Component: TicketsPage };
          },
        },
        { path: '*', Component: NotFound },
      ],
    },
  ]);
}
