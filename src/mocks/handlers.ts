import { http, HttpResponse, delay } from 'msw';
import {
  memberInputSchema,
  memberQuerySchema,
} from '../features/members/schema';
import {
  ticketInputSchema,
  ticketUpdateSchema,
  ticketQuerySchema,
  transitions,
} from '../features/tickets/schema';
import { type ApiErrorBody } from '../shared/api-types';
import { resetStore, store } from './store';
import { env } from '../shared/env';
const base =
  '*' + new URL(env.apiUrl, 'http://localhost').pathname.replace(/\/$/, '');

const fail = (
  status: number,
  code: ApiErrorBody['code'],
  message: string,
  fields?: Record<string, string>,
) =>
  HttpResponse.json(
    { code, message, ...(fields ? { fields } : {}) },
    { status },
  );
function invalid(error: {
  issues: { path: PropertyKey[]; message: string }[];
}) {
  return fail(
    422,
    'VALIDATION',
    '请检查输入',
    Object.fromEntries(error.issues.map((i) => [i.path.join('.'), i.message])),
  );
}
function paginate<T extends object>(
  items: T[],
  query: { page: number; pageSize: number; sort: string; direction: string },
) {
  const rank: Record<string, number> =
    query.sort === 'priority'
      ? { low: 0, medium: 1, high: 2 }
      : query.sort === 'status'
        ? {
            active: 0,
            inactive: 1,
            open: 0,
            in_progress: 1,
            resolved: 2,
            closed: 3,
          }
        : {};
  const sorted = [...items].sort((a, b) => {
    const left = String(Reflect.get(a, query.sort));
    const right = String(Reflect.get(b, query.sort));
    const leftRank = rank[left];
    const rightRank = rank[right];
    const compared =
      leftRank !== undefined && rightRank !== undefined
        ? leftRank - rightRank
        : left.localeCompare(right, 'zh-CN');
    return compared * (query.direction === 'asc' ? 1 : -1);
  });
  return HttpResponse.json({
    items: sorted.slice(
      (query.page - 1) * query.pageSize,
      query.page * query.pageSize,
    ),
    total: sorted.length,
    page: query.page,
    pageSize: query.pageSize,
  });
}
async function forcedFailure() {
  await delay(80);
  if (store.scenario === 'failure') {
    store.scenario = 'none';
    return fail(500, 'INTERNAL', '演练：保存失败，请重试，输入已保留');
  }
  return undefined;
}
export const handlers = [
  http.post(base + '/__mock/reset', () => {
    resetStore();
    return new HttpResponse(null, { status: 204 });
  }),
  http.post(base + '/__mock/scenario', async ({ request }) => {
    const body: unknown = await request.json();
    if (
      typeof body === 'object' &&
      body !== null &&
      'scenario' in body &&
      (body.scenario === 'failure' ||
        body.scenario === 'conflict' ||
        body.scenario === 'none')
    )
      store.scenario = body.scenario;
    return new HttpResponse(null, { status: 204 });
  }),
  http.get(base + '/members', ({ request }) => {
    const q = memberQuerySchema.parse(
      Object.fromEntries(new URL(request.url).searchParams),
    );
    return paginate(
      store.members.filter(
        (m) =>
          (!q.q ||
            (m.name + m.email).toLowerCase().includes(q.q.toLowerCase())) &&
          (!q.role || m.role === q.role) &&
          (!q.status || m.status === q.status),
      ),
      q,
    );
  }),
  http.get(base + '/members/:id', ({ params }) => {
    const member = store.members.find((m) => m.id === params.id);
    return member
      ? HttpResponse.json(member)
      : fail(404, 'NOT_FOUND', '成员不存在');
  }),
  http.post(base + '/members', async ({ request }) => {
    const forced = await forcedFailure();
    if (forced) return forced;
    const parsed = memberInputSchema.safeParse(await request.json());
    if (!parsed.success) return invalid(parsed.error);
    if (store.members.some((m) => m.email === parsed.data.email))
      return fail(409, 'DUPLICATE_EMAIL', '邮箱已被使用', {
        email: '该邮箱已被使用',
      });
    const member = { ...parsed.data, id: 'm' + ++store.sequence };
    store.members.push(member);
    return HttpResponse.json(member, { status: 201 });
  }),
  http.put(base + '/members/:id', async ({ request, params }) => {
    const forced = await forcedFailure();
    if (forced) return forced;
    const member = store.members.find((m) => m.id === params.id);
    if (!member) return fail(404, 'NOT_FOUND', '成员不存在');
    const parsed = memberInputSchema.safeParse(await request.json());
    if (!parsed.success) return invalid(parsed.error);
    if (
      store.members.some(
        (m) => m.id !== member.id && m.email === parsed.data.email,
      )
    )
      return fail(409, 'DUPLICATE_EMAIL', '邮箱已被使用', {
        email: '该邮箱已被使用',
      });
    Object.assign(member, parsed.data);
    return HttpResponse.json(member);
  }),
  http.delete(base + '/members/:id', async ({ params }) => {
    await delay(80);
    if (!store.members.some((m) => m.id === params.id))
      return fail(404, 'NOT_FOUND', '成员不存在');
    if (store.tickets.some((t) => t.assigneeId === params.id))
      return fail(409, 'MEMBER_IN_USE', '该成员有关联工单，不能删除');
    store.members = store.members.filter((m) => m.id !== params.id);
    return new HttpResponse(null, { status: 204 });
  }),
  http.get(base + '/tickets', ({ request }) => {
    const q = ticketQuerySchema.parse(
      Object.fromEntries(new URL(request.url).searchParams),
    );
    return paginate(
      store.tickets.filter(
        (t) =>
          (!q.q || (t.title + t.description).includes(q.q)) &&
          (!q.status || q.status === t.status) &&
          (!q.priority || q.priority === t.priority),
      ),
      q,
    );
  }),
  http.post(base + '/tickets', async ({ request }) => {
    const forced = await forcedFailure();
    if (forced) return forced;
    const parsed = ticketInputSchema.safeParse(await request.json());
    if (!parsed.success) return invalid(parsed.error);
    if (parsed.data.status !== 'open')
      return fail(422, 'INVALID_TRANSITION', '新工单必须为待处理状态', {
        status: '新工单必须为待处理状态',
      });
    if (
      !store.members.some(
        (m) => m.id === parsed.data.assigneeId && m.status === 'active',
      )
    )
      return fail(422, 'INACTIVE_ASSIGNEE', '请选择启用成员', {
        assigneeId: '请选择启用成员',
      });
    const ticket = { ...parsed.data, id: 't' + ++store.sequence, version: 1 };
    store.tickets.push(ticket);
    return HttpResponse.json(ticket, { status: 201 });
  }),
  http.put(base + '/tickets/:id', async ({ request, params }) => {
    const forced = await forcedFailure();
    if (forced) return forced;
    const ticket = store.tickets.find((t) => t.id === params.id);
    if (!ticket) return fail(404, 'NOT_FOUND', '工单不存在');
    const parsed = ticketUpdateSchema.safeParse(await request.json());
    if (!parsed.success) return invalid(parsed.error);
    if (store.scenario === 'conflict') {
      ticket.version++;
      store.scenario = 'none';
    }
    if (ticket.version !== parsed.data.version)
      return fail(
        409,
        'VERSION_CONFLICT',
        '工单已被他人修改；输入已保留，请关闭后重新打开以读取最新版本',
      );
    if (!transitions[ticket.status].includes(parsed.data.status))
      return fail(422, 'INVALID_TRANSITION', '不允许此状态流转', {
        status: '不允许此状态流转',
      });
    if (
      parsed.data.assigneeId !== ticket.assigneeId &&
      !store.members.some(
        (m) => m.id === parsed.data.assigneeId && m.status === 'active',
      )
    )
      return fail(422, 'INACTIVE_ASSIGNEE', '请选择启用成员', {
        assigneeId: '请选择启用成员',
      });
    const updated = {
      ...parsed.data,
      id: ticket.id,
      version: ticket.version + 1,
    };
    store.tickets = store.tickets.map((t) =>
      t.id === ticket.id ? updated : t,
    );
    return HttpResponse.json(updated);
  }),
  http.delete(base + '/tickets/:id', async ({ params }) => {
    await delay(80);
    if (!store.tickets.some((t) => t.id === params.id))
      return fail(404, 'NOT_FOUND', '工单不存在');
    store.tickets = store.tickets.filter((t) => t.id !== params.id);
    return new HttpResponse(null, { status: 204 });
  }),
];
