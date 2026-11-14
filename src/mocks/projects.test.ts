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
import { projectsApi } from '@/api/projects/requests';
import { membersApi } from '@/api/members/requests';
import { projectQuerySchema, projectSchema } from '@/api/projects/schemas';
import { pageSchema } from '@/api/types';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(resetStore);
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const input = {
  name: '新项目',
  code: 'TD-99',
  status: 'in_progress' as const,
  ownerId: 'm1',
};
test('项目 CRUD、编号归一及分页响应符合契约', async () => {
  const created = await projectsApi.create({ ...input, code: ' td-99 ' });
  expect(projectSchema.parse(created).code).toBe('TD-99');
  const page = await projectsApi.list(
    projectQuerySchema.parse({ q: 'TD-99', pageSize: 5 }),
  );
  expect(pageSchema(projectSchema).parse(page).total).toBe(1);
  await projectsApi.update(created.id, { ...input, status: 'archived' });
  expect(
    (
      await projectsApi.list(
        projectQuerySchema.parse({ status: 'archived', pageSize: 10 }),
      )
    ).items.map((p) => p.id),
  ).toContain(created.id);
});
test('重复编号返回 409 DUPLICATE_CODE，停用成员不能担任负责人', async () => {
  await expect(
    projectsApi.create({ ...input, code: 'td-01' }),
  ).rejects.toMatchObject({
    status: 409,
    body: { code: 'DUPLICATE_CODE', fields: { code: '该编号已被使用' } },
  });
  await expect(
    projectsApi.create({ ...input, ownerId: 'm3' }),
  ).rejects.toMatchObject({
    status: 422,
    body: { code: 'INACTIVE_OWNER', fields: { ownerId: '请选择启用成员' } },
  });
});
test('归档后拒绝更换负责人，未更换时可继续编辑', async () => {
  await expect(
    projectsApi.update('p2', {
      name: '团队手册改版',
      code: 'TD-02',
      status: 'archived',
      ownerId: 'm2',
    }),
  ).rejects.toMatchObject({
    status: 409,
    body: { code: 'ARCHIVED_OWNER_LOCKED' },
  });
  const renamed = await projectsApi.update('p2', {
    name: '团队手册 2.0',
    code: 'TD-02',
    status: 'archived',
    ownerId: 'm1',
  });
  expect(renamed.name).toBe('团队手册 2.0');
});
test('负责项目的成员不能删除', async () => {
  await expect(membersApi.remove('m1')).rejects.toMatchObject({
    status: 409,
    body: { code: 'MEMBER_IN_USE', message: '该成员负责项目，不能删除' },
  });
});
test('非法 URL 参数恢复默认并按状态排序', async () => {
  expect(
    projectQuerySchema.parse({ page: -1, pageSize: 999, status: 'bad' }),
  ).toMatchObject({ page: 1, pageSize: 10, status: '', sort: 'name' });
  const sorted = await projectsApi.list(
    projectQuerySchema.parse({ sort: 'status', direction: 'desc' }),
  );
  expect(sorted.items.map((p) => p.status)).toEqual([
    'archived',
    'in_progress',
  ]);
});
