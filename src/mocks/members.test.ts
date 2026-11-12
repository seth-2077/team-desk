import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  expect,
  test,
} from 'vitest';
import { server } from './server';
import { resetStore } from './store';
import { membersApi } from '../features/members/api';
import { memberQuerySchema, memberSchema } from '../features/members/schema';
import { pageSchema } from '../shared/api-types';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(resetStore);
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const input = {
  name: '新成员',
  email: 'new@teamdesk.dev',
  role: 'agent' as const,
  status: 'active' as const,
};
test('成员 CRUD 及分页响应符合契约', async () => {
  const created = await membersApi.create(input);
  expect(memberSchema.parse(created).name).toBe('新成员');
  const page = await membersApi.list(
    memberQuerySchema.parse({ q: '新成员', pageSize: 5 }),
  );
  expect(pageSchema(memberSchema).parse(page).total).toBe(1);
  await membersApi.update(created.id, { ...input, status: 'inactive' });
  expect((await membersApi.get(created.id)).status).toBe('inactive');
  await membersApi.remove(created.id);
  expect(
    (await membersApi.list(memberQuerySchema.parse({ q: '新成员' }))).total,
  ).toBe(0);
});
test('重复邮箱返回字段错误，关联工单阻止删除', async () => {
  await expect(
    membersApi.create({ ...input, email: 'LIN@teamdesk.dev' }),
  ).rejects.toMatchObject({
    status: 409,
    body: { code: 'DUPLICATE_EMAIL', fields: { email: '该邮箱已被使用' } },
  });
  await expect(membersApi.remove('m2')).rejects.toMatchObject({
    status: 409,
    body: { code: 'MEMBER_IN_USE' },
  });
});
test('角色状态筛选、排序及非法 URL 参数恢复默认', async () => {
  const page = await membersApi.list(
    memberQuerySchema.parse({ role: 'viewer', status: 'inactive' }),
  );
  expect(page.items.map((m) => m.id)).toEqual(['m3']);
  expect(
    memberQuerySchema.parse({
      page: -2,
      pageSize: 999,
      role: 'bad',
      sort: 'bad',
    }),
  ).toMatchObject({ page: 1, pageSize: 10, role: '', sort: 'name' });
  const sorted = await membersApi.list(
    memberQuerySchema.parse({ sort: 'email', direction: 'desc', pageSize: 5 }),
  );
  expect(sorted.items.map((m) => m.email)).toEqual([
    'zhou@teamdesk.dev',
    'lin@teamdesk.dev',
    'chen@teamdesk.dev',
  ]);
});
