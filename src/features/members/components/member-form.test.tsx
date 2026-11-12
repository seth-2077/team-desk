import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, test, vi } from 'vitest';
import { MemberForm } from './member-form';
import { ApiError } from '../../../shared/api';

afterEach(cleanup);
const member = {
  id: 'm1',
  name: '林晓',
  email: 'lin@teamdesk.dev',
  role: 'admin' as const,
  status: 'active' as const,
};
test('保存失败保留输入并回填字段', async () => {
  const user = userEvent.setup();
  const onSave = vi.fn().mockRejectedValue(
    new ApiError(
      {
        code: 'DUPLICATE_EMAIL',
        message: '邮箱已被使用',
        fields: { email: '该邮箱已被使用' },
      },
      409,
    ),
  );
  render(<MemberForm member={member} onSave={onSave} onClose={vi.fn()} />);
  await user.clear(screen.getByLabelText('姓名'));
  await user.type(screen.getByLabelText('姓名'), '修改后');
  await user.click(screen.getByRole('button', { name: /^保存$/ }));
  expect(await screen.findByText('该邮箱已被使用')).toBeVisible();
  expect(screen.getByLabelText('姓名')).toHaveValue('修改后');
});
test('不同编辑对象使用 key 重新初始化草稿', () => {
  const props = { onSave: vi.fn(), onClose: vi.fn() };
  const { rerender } = render(
    <MemberForm key="m1" member={member} {...props} />,
  );
  rerender(
    <MemberForm
      key="m2"
      member={{ ...member, id: 'm2', name: '陈宇' }}
      {...props}
    />,
  );
  expect(screen.getByLabelText('姓名')).toHaveValue('陈宇');
});
