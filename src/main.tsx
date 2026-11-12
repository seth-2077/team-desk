import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';
import { env } from './shared/env';
import './styles.css';

const router = createRouter({ routeTree, defaultPreload: 'intent' });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

async function start() {
  if (env.mock) {
    const { worker } = await import('./mocks/browser');
    await worker.start({ onUnhandledRequest: 'bypass' });
  }
  const root = document.getElementById('root');
  if (!root) throw new Error('缺少应用挂载节点');
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: 1, staleTime: 30_000 },
      mutations: { retry: false },
    },
  });
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <QueryClientProvider client={client}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </React.StrictMode>,
  );
}
void start().catch((error: unknown) => {
  const root = document.getElementById('root');
  if (root)
    root.textContent = error instanceof Error ? error.message : '启动失败';
});
