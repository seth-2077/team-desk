import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  expect,
  test,
} from 'vitest';
import { server } from './server';
import { resetStore, store } from './store';
import { ticketsApi } from '@/api/tickets/requests';
import { ticketsQuery } from '@/api/tickets/queries';
import {
  ticketInputSchema,
  ticketQuerySchema,
  ticketSchema,
  transitions,
  type TicketInput,
} from '@/api/tickets/schemas';
import { pageSchema } from '@/api/types';
import { request } from '@/api/client';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(resetStore);
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
const input: TicketInput = {
  title: '测试工单',
  description: '固定测试内容',
  type: 'normal',
  status: 'open',
  priority: 'high',
  assigneeId: 'm1',
  startsAt: '2026-11-12T09:00:00',
  dueAt: '2026-11-13T18:00:00',
  checklist: [{ text: '确认结果', done: false }],
};
function existing(id: string) {
  const value = store.tickets.find((ticket) => ticket.id === id);
  if (!value) throw new Error('缺少固定测试数据');
  return value;
}
test('完整 CRUD、分页、筛选、排序响应符合契约', async () => {
  for (let i = 0; i < 7; i++)
    await ticketsApi.create({ ...input, title: '测试工单 ' + i });
  const query = ticketQuerySchema.parse({
    q: '测试工单',
    page: 2,
    pageSize: 5,
    priority: 'high',
    status: 'open',
    direction: 'desc',
  });
  const page = pageSchema(ticketSchema).parse(await ticketsApi.list(query));
  expect(page).toMatchObject({ total: 7, page: 2, pageSize: 5 });
  expect(page.items.map((ticket) => ticket.title)).toEqual([
    '测试工单 1',
    '测试工单 0',
  ]);
  const created = await ticketsApi.create(input);
  const updated = await ticketsApi.update(created.id, {
    ...input,
    title: '修改工单',
    status: 'in_progress',
    version: created.version,
  });
  expect(updated).toMatchObject({
    title: '修改工单',
    version: 2,
    status: 'in_progress',
  });
  await ticketsApi.remove(created.id);
  expect(
    (await ticketsApi.list(ticketQuerySchema.parse({ q: '修改工单' }))).total,
  ).toBe(0);
});
test('停用成员禁止新指派，但历史负责人可原样保留', async () => {
  await expect(
    ticketsApi.create({ ...input, assigneeId: 'm3' }),
  ).rejects.toMatchObject({
    body: {
      code: 'INACTIVE_ASSIGNEE',
      fields: { assigneeId: '请选择启用成员' },
    },
  });
  const historical = existing('t2');
  await expect(
    ticketsApi.update(historical.id, {
      ...historical,
      title: '保留停用负责人',
    }),
  ).resolves.toMatchObject({ assigneeId: 'm3' });
  const ticket = existing('t1');
  await expect(
    ticketsApi.update(ticket.id, { ...ticket, assigneeId: 'm3' }),
  ).rejects.toMatchObject({ body: { code: 'INACTIVE_ASSIGNEE' } });
});
test('条件字段与时间规则由服务端执行，不能绕过客户端', async () => {
  await expect(
    ticketsApi.create({ ...input, type: 'incident' }),
  ).rejects.toMatchObject({
    status: 422,
    body: { fields: { impact: '故障工单必须填写影响范围' } },
  });
  await expect(
    ticketsApi.create({ ...input, impact: '不得提交' }),
  ).rejects.toMatchObject({
    status: 422,
    body: { fields: { impact: '普通工单不得提交影响范围' } },
  });
  await expect(
    ticketsApi.create({ ...input, dueAt: '2026-11-11T09:00:00' }),
  ).rejects.toMatchObject({
    status: 422,
    body: { fields: { dueAt: '截止时间不能早于计划开始时间' } },
  });
  expect(
    ticketInputSchema.safeParse({
      ...input,
      checklist: [{ text: '', done: false }],
    }).success,
  ).toBe(false);
});
test('状态机拒绝跳步和终态恢复，新建必须为待处理', async () => {
  await expect(
    ticketsApi.create({ ...input, status: 'resolved' }),
  ).rejects.toMatchObject({ body: { code: 'INVALID_TRANSITION' } });
  const created = await ticketsApi.create(input);
  await expect(
    ticketsApi.update(created.id, { ...input, status: 'resolved', version: 1 }),
  ).rejects.toMatchObject({ body: { code: 'INVALID_TRANSITION' } });
  const closed = await ticketsApi.update(created.id, {
    ...input,
    status: 'closed',
    version: 1,
  });
  await expect(
    ticketsApi.update(closed.id, { ...input, version: closed.version }),
  ).rejects.toMatchObject({ body: { code: 'INVALID_TRANSITION' } });
  expect(transitions.in_progress).toContain('open');
});
test('版本过期与可重复失败/冲突场景', async () => {
  const created = await ticketsApi.create(input);
  await ticketsApi.update(created.id, { ...input, version: 1 });
  await expect(
    ticketsApi.update(created.id, { ...input, version: 1 }),
  ).rejects.toMatchObject({ status: 409, body: { code: 'VERSION_CONFLICT' } });
  store.scenario = 'failure';
  await expect(ticketsApi.create(input)).rejects.toMatchObject({
    status: 500,
    body: { code: 'INTERNAL' },
  });
  await expect(ticketsApi.create(input)).resolves.toMatchObject({
    title: input.title,
  });
  store.scenario = 'conflict';
  const historical = existing('t1');
  await expect(
    ticketsApi.update(historical.id, { ...historical }),
  ).rejects.toMatchObject({ status: 409, body: { code: 'VERSION_CONFLICT' } });
});
test('404 和分页非法参数具有确定处理', async () => {
  await expect(ticketsApi.remove('missing')).rejects.toMatchObject({
    status: 404,
  });
  const page = await request(
    '/tickets?page=-9&pageSize=abc&status=bad',
    pageSchema(ticketSchema),
  );
  expect(page).toMatchObject({ page: 1, pageSize: 10, total: 2 });
});
test('Query key 包含完整查询且信号传到 HTTP 请求', async () => {
  const first = ticketsQuery(ticketQuerySchema.parse({ q: 'a', page: 1 }));
  const second = ticketsQuery(ticketQuerySchema.parse({ q: 'a', page: 2 }));
  expect(first.queryKey).not.toEqual(second.queryKey);
  const controller = new AbortController();
  controller.abort();
  await expect(
    ticketsApi.list(ticketQuerySchema.parse({}), controller.signal),
  ).rejects.toMatchObject({ name: 'AbortError' });
});
