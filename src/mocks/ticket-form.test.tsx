import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  expect,
  test,
  vi,
} from 'vitest';
import { server } from './server';
import { resetStore, store } from './store';
import { ApiError } from '../shared/api';
import {
  TicketForm,
  toTicketForm,
  toTicketInput,
} from '../features/tickets/ticket-form';
import { type Ticket } from '../features/tickets/schema';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(resetStore);
afterEach(() => {
  cleanup();
  server.resetHandlers();
});
afterAll(() => server.close());
function fixture(id = 't1') {
  const ticket = store.tickets.find((item) => item.id === id);
  if (!ticket) throw new Error('固定数据缺失');
  return structuredClone(ticket);
}
function form(ticket: Ticket, onSave = vi.fn().mockResolvedValue(undefined)) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const onClose = vi.fn();
  const view = render(
    <QueryClientProvider client={client}>
      <TicketForm
        key={ticket.id}
        ticket={ticket}
        onSave={onSave}
        onClose={onClose}
      />
    </QueryClientProvider>,
  );
  return { ...view, onSave, onClose, client };
}
test('故障必填影响范围；切回普通提交不包含影响范围', async () => {
  const user = userEvent.setup();
  const view = form(fixture());
  await user.clear(screen.getByLabelText('影响范围'));
  await user.click(screen.getByRole('button', { name: /^保存$/ }));
  expect(await screen.findByText('故障工单必须填写影响范围')).toBeVisible();
  expect(view.onSave).not.toHaveBeenCalled();
  await user.type(screen.getByLabelText('影响范围'), '支付服务');
  await user.click(screen.getByLabelText('工单类型'));
  await user.click(screen.getByRole('option', { name: '普通工单' }));
  expect(screen.queryByLabelText('影响范围')).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: /^保存$/ }));
  await waitFor(() => expect(view.onSave).toHaveBeenCalledTimes(1));
  expect(view.onSave.mock.calls[0]?.[0]).not.toHaveProperty('impact');
});
test('时间校验阻止提交，动态检查项可增删并保存', async () => {
  const user = userEvent.setup();
  const view = form(fixture());
  await user.clear(screen.getByLabelText('截止时间'));
  await user.type(screen.getByLabelText('截止时间'), '2026-11-11T09:00');
  await user.click(screen.getByRole('button', { name: /^保存$/ }));
  expect(await screen.findByText('截止时间不能早于计划开始时间')).toBeVisible();
  await user.clear(screen.getByLabelText('截止时间'));
  await user.type(screen.getByLabelText('截止时间'), '2026-11-14T18:00');
  await user.click(screen.getByRole('button', { name: '添加检查项' }));
  await user.type(
    screen.getByLabelText('检查项 2', { exact: true }),
    '验证恢复',
  );
  await user.click(screen.getByRole('button', { name: '删除检查项 1' }));
  await user.click(screen.getByLabelText('完成检查项 1'));
  await user.click(screen.getByRole('button', { name: /^保存$/ }));
  await waitFor(() => expect(view.onSave).toHaveBeenCalledTimes(1));
  expect(view.onSave.mock.calls[0]?.[0]).toMatchObject({
    checklist: [{ text: '验证恢复', done: true }],
  });
});
test.each(['INTERNAL', 'VERSION_CONFLICT'] as const)(
  '%s 后保留全部草稿并允许修正',
  async (code) => {
    const user = userEvent.setup();
    const view = form(
      fixture(),
      vi
        .fn()
        .mockRejectedValue(
          new ApiError(
            { code, message: '服务端拒绝保存' },
            code === 'INTERNAL' ? 500 : 409,
          ),
        ),
    );
    await user.clear(screen.getByLabelText('工单标题'));
    await user.type(screen.getByLabelText('工单标题'), '用户未保存的标题');
    await user.click(screen.getByRole('button', { name: /^保存$/ }));
    expect(await screen.findByText('服务端拒绝保存')).toBeVisible();
    expect(screen.getByLabelText('工单标题')).toHaveValue('用户未保存的标题');
    expect(screen.getByLabelText('影响范围')).toHaveValue('支付服务');
    expect(view.onClose).not.toHaveBeenCalled();
  },
);
test('切换编辑对象重置；实体到表单转换不修改原实体', async () => {
  const user = userEvent.setup();
  const first = fixture();
  const view = form(first);
  await user.type(screen.getByLabelText('工单标题'), '草稿');
  const second = fixture('t2');
  view.rerender(
    <QueryClientProvider client={view.client}>
      <TicketForm
        key={second.id}
        ticket={second}
        onSave={view.onSave}
        onClose={view.onClose}
      />
    </QueryClientProvider>,
  );
  expect(screen.getByLabelText('工单标题')).toHaveValue(second.title);
  expect(screen.queryByLabelText('影响范围')).not.toBeInTheDocument();
  const draft = toTicketForm(first);
  draft.checklist[0] = { text: '草稿', done: true };
  expect(first.checklist[0]?.text).toBe('检查告警日志');
  expect(toTicketInput(toTicketForm(first))).toMatchObject({
    startsAt: first.startsAt,
  });
});
test('保存期间禁用提交、取消、关闭及 Escape，防止重复提交', async () => {
  const user = userEvent.setup();
  let finish: () => void = () => undefined;
  const save = vi.fn(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
  );
  const view = form(fixture(), save);
  await user.click(screen.getByRole('button', { name: /^保存$/ }));
  expect(screen.getByRole('button', { name: '保存中…' })).toBeDisabled();
  expect(screen.getByRole('button', { name: '取消' })).toBeDisabled();
  expect(screen.getByLabelText('工单类型')).toBeDisabled();
  expect(screen.getByLabelText('负责人', { exact: true })).toBeDisabled();
  await user.keyboard('{Escape}');
  expect(view.onClose).not.toHaveBeenCalled();
  expect(save).toHaveBeenCalledTimes(1);
  finish();
  await waitFor(() => expect(view.onClose).toHaveBeenCalledOnce());
});
test('历史停用负责人展示，异步搜索仅提供启用成员', async () => {
  const user = userEvent.setup();
  form(fixture('t2'));
  await user.click(screen.getByLabelText('负责人', { exact: true }));
  expect(
    await screen.findByRole('option', { name: '周宁（已停用，历史负责人）' }),
  ).toBeInTheDocument();
  await user.keyboard('{Escape}');
  await user.type(screen.getByLabelText('搜索负责人'), '林');
  await user.click(screen.getByLabelText('负责人', { exact: true }));
  expect(
    await screen.findByRole('option', { name: '林晓 · lin@teamdesk.dev' }),
  ).toBeInTheDocument();
  await waitFor(() =>
    expect(
      screen.queryByRole('option', { name: /陈宇/ }),
    ).not.toBeInTheDocument(),
  );
});

test('服务端字段错误回填负责人并聚焦到选择控件', async () => {
  const user = userEvent.setup();
  form(
    fixture(),
    vi.fn().mockRejectedValue(
      new ApiError(
        {
          code: 'INACTIVE_ASSIGNEE',
          message: '负责人状态已变化',
          fields: { assigneeId: '该成员刚被停用，请重新选择' },
        },
        422,
      ),
    ),
  );
  await user.click(screen.getByRole('button', { name: /^保存$/ }));
  expect(await screen.findByText('该成员刚被停用，请重新选择')).toBeVisible();
  expect(screen.getByLabelText('负责人', { exact: true })).toHaveFocus();
});
