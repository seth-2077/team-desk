import {
  render,
  screen,
  cleanup,
  fireEvent,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, test, vi } from 'vitest';
import { SearchInput } from './search-input';

afterEach(cleanup);

function renderInput(
  overrides: Partial<Parameters<typeof SearchInput>[0]> = {},
) {
  const onValueChange = vi.fn();
  const view = render(
    <SearchInput
      aria-label="搜索"
      value=""
      onValueChange={onValueChange}
      {...overrides}
    />,
  );
  return { ...view, onValueChange };
}

test('默认回车才提交，输入过程不发查询', async () => {
  const user = userEvent.setup();
  const { onValueChange } = renderInput();
  await user.type(screen.getByLabelText('搜索'), '陈');
  expect(onValueChange).not.toHaveBeenCalled();
  await user.keyboard('{Enter}');
  expect(onValueChange).toHaveBeenCalledWith('陈');
  expect(onValueChange).toHaveBeenCalledTimes(1);
});

test('输入法合成期间回车不提交，合成结束后提交汉字', () => {
  const { onValueChange } = renderInput();
  const input = screen.getByLabelText('搜索');
  fireEvent.compositionStart(input);
  fireEvent.change(input, { target: { value: 'chen' } });
  fireEvent.keyDown(input, { key: 'Enter' });
  expect(onValueChange).not.toHaveBeenCalled();
  fireEvent.change(input, { target: { value: '陈' } });
  fireEvent.compositionEnd(input);
  fireEvent.keyDown(input, { key: 'Enter' });
  expect(onValueChange).toHaveBeenCalledWith('陈');
  expect(onValueChange).not.toHaveBeenCalledWith('chen');
});

test('失焦提交，点搜索图标提交，清除按钮提交空值', async () => {
  const user = userEvent.setup();
  const { onValueChange } = renderInput();
  const input = screen.getByLabelText('搜索');
  await user.type(input, '陈');
  await user.tab();
  expect(onValueChange).toHaveBeenLastCalledWith('陈');
  await user.type(input, '宇');
  await user.click(screen.getByRole('button', { name: '执行搜索' }));
  expect(onValueChange).toHaveBeenLastCalledWith('陈宇');
  await user.click(screen.getByRole('button', { name: '清除搜索' }));
  expect(input).toHaveValue('');
  expect(onValueChange).toHaveBeenLastCalledWith('');
});

test('live 模式防抖提交，合成期间不提交拼音', async () => {
  const { onValueChange } = renderInput({ live: true, delay: 10 });
  const input = screen.getByLabelText('搜索');
  fireEvent.compositionStart(input);
  fireEvent.change(input, { target: { value: 'chen' } });
  expect(onValueChange).not.toHaveBeenCalled();
  fireEvent.change(input, { target: { value: '陈' } });
  fireEvent.compositionEnd(input);
  await waitFor(() => expect(onValueChange).toHaveBeenCalledWith('陈'));
  expect(onValueChange).not.toHaveBeenCalledWith('chen');
  expect(onValueChange).toHaveBeenCalledTimes(1);
});
