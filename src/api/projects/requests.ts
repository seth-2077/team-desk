import { pageSchema } from '../types';
import { projectSchema, type ProjectInput, type ProjectQuery } from './schemas';
import { queryString, request } from '../client';

export const projectsApi = {
  list: (query: ProjectQuery, signal?: AbortSignal) =>
    request('/projects?' + queryString(query), pageSchema(projectSchema), {
      signal,
    }),
  create: (input: ProjectInput) =>
    request('/projects', projectSchema, {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  update: (id: string, input: ProjectInput) =>
    request('/projects/' + encodeURIComponent(id), projectSchema, {
      method: 'PUT',
      body: JSON.stringify(input),
    }),
};
