import type { QueryClient } from '@tanstack/react-query';
import {
  createRootRouteWithContext,
  Link,
  Outlet,
} from '@tanstack/react-router';
import { ArrowRight, LayoutDashboard, Ticket, Users } from 'lucide-react';
import { memberQuerySchema } from '../features/members';
import { ticketQuerySchema } from '../features/tickets';
import { Button } from '../shared/ui/button';

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()(
  {
    component: Layout,
    errorComponent: ({ error, reset }) => (
      <div role="alert" className="p-12">
        <h1 className="text-xl">页面暂时无法显示</h1>
        <p>{error instanceof Error ? error.message : '未知异常'}</p>
        <Button onClick={reset}>重试</Button>
      </div>
    ),
    notFoundComponent: () => (
      <div className="p-12">
        页面不存在。
        <Link to="/members" search={memberQuerySchema.parse({})}>
          返回成员管理
        </Link>
      </div>
    ),
  },
);

function Layout() {
  return (
    <div className="min-h-screen md:flex">
      <aside className="border-r border-slate-200 bg-white p-6 md:fixed md:inset-y-0 md:w-60">
        <Link
          to="/members"
          search={memberQuerySchema.parse({})}
          className="flex items-center gap-2 text-xl font-bold tracking-tight"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white">
            <LayoutDashboard size={21} />
          </span>
          TeamDesk<span className="text-blue-600">.</span>
        </Link>
        <p className="mb-8 mt-2 text-xs text-slate-400">让团队工作，井然有序</p>
        <p className="mb-3 text-[10px] font-semibold tracking-widest text-slate-400">
          工作空间
        </p>
        <nav className="flex gap-2 md:flex-col">
          <Link
            to="/members"
            search={memberQuerySchema.parse({})}
            activeProps={{ className: 'bg-blue-50 text-blue-700' }}
            activeOptions={{ includeSearch: false }}
            className="flex items-center gap-3 rounded-lg p-3 text-sm"
          >
            <Users size={18} />
            成员管理
          </Link>
          <Link
            to="/tickets"
            search={ticketQuerySchema.parse({})}
            activeProps={{ className: 'bg-blue-50 text-blue-700' }}
            activeOptions={{ includeSearch: false }}
            className="flex items-center gap-3 rounded-lg p-3 text-sm"
          >
            <Ticket size={18} />
            工单管理
          </Link>
        </nav>
        <div className="mt-10 hidden rounded-lg bg-slate-50 p-4 text-xs leading-6 text-slate-500 md:absolute md:bottom-6 md:left-6 md:right-6 md:block">
          <span className="font-semibold text-slate-700">
            TeamDesk 演示空间
          </span>
          <br />
          固定数据 · HTTP Mock
          <br />
          <span className="inline-flex items-center gap-1 text-blue-600">
            为高效协作而设计 <ArrowRight size={12} />
          </span>
        </div>
      </aside>
      <div className="min-w-0 flex-1 md:ml-60">
        <header className="flex h-17 items-center justify-between border-b border-slate-200 bg-white px-8 text-xs text-slate-500">
          <span>团队工作台</span>
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            开发演示环境
            <span className="ml-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 font-medium text-slate-600">
              TD
            </span>
          </span>
        </header>
        <main className="mx-auto max-w-7xl px-5 py-9 lg:px-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
