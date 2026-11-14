import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router';
import { env } from '@/lib/env';
import { createAppRouter } from './router';
import '@/styles.css';

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: 1, staleTime: 30_000 },
      mutations: { retry: false },
    },
  });
}

async function start() {
  if (env.mock) {
    const { worker } = await import('@/mocks/browser');
    await worker.start({ onUnhandledRequest: 'bypass' });
  }
  const root = document.getElementById('root');
  if (!root) throw new Error('缺少应用挂载节点');
  const queryClient = createQueryClient();
  const router = createAppRouter(queryClient);
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
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
