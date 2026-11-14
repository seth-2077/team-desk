import { queryOptions } from '@tanstack/react-query';
import type { ProjectQuery } from './schemas';
import { projectsApi } from './requests';

export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: (query: ProjectQuery) => [...projectKeys.lists(), query] as const,
};
export const projectsQuery = (query: ProjectQuery) =>
  queryOptions({
    queryKey: projectKeys.list(query),
    queryFn: ({ signal }) => projectsApi.list(query, signal),
  });
