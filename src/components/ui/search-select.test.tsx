import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, test, vi } from 'vitest';
import { SearchSelect } from './search-select';

afterEach(cleanup);

function renderSelect(
  overrides: Partial<Parameters<typeof SearchSelect>[0]> = {},
) {
  const props = {
    id: 'ownerId',
    value: '',
    onChange: vi.fn(),
    options: [
      { value: '', label: '请选择负责人' },
      { value: 'm1', label: '林晓 · lin@teamdesk.dev' },
    ],
    search: '',
    onSearchChange: vi.fn(),
    searchLabel: '搜索负责人',
    ...overrides,
  };
  return render(
    <>
      <label htmlFor="ownerId">负责人</label>
      <SearchSelect {...props} />
    </>,
  );
}

test('搜索与选择回传，状态行始终占位', async () => {
  const user = userEvent.setup();
  const onSearchChange = vi.fn();
  const onChange = vi.fn();
  renderSelect({ onSearchChange, onChange });
  const status = screen.getByRole('status');
  expect(status).toBeInTheDocument();
  expect(status).toHaveClass('min-h-4');
  await user.type(screen.getByLabelText('搜索负责人'), '林');
  await waitFor(() => expect(onSearchChange).toHaveBeenLastCalledWith('林'));
  await user.click(
    await screen.findByRole('option', { name: '林晓 · lin@teamdesk.dev' }),
  );
  expect(onChange).toHaveBeenCalledWith('m1');
});
test('加载与错误复用同一状态行，错误标记下拉', () => {
  const { rerender } = renderSelect({ loading: true });
  expect(screen.getByRole('status')).toHaveTextContent('搜索中…');
  rerender(
    <>
      <label htmlFor="ownerId">负责人</label>
      <SearchSelect
        id="ownerId"
        value=""
        onChange={vi.fn()}
        options={[{ value: '', label: '请选择负责人' }]}
        search=""
        onSearchChange={vi.fn()}
        searchLabel="搜索负责人"
        errorText="负责人加载失败"
        error="请选择负责人"
        disabled
      />
    </>,
  );
  expect(screen.getByRole('alert')).toHaveTextContent('负责人加载失败');
  expect(screen.queryByText('搜索中…')).not.toBeInTheDocument();
  const select = screen.getByLabelText('负责人');
  expect(select).toBeDisabled();
  expect(select).toHaveAttribute('aria-invalid', 'true');
  expect(screen.getByLabelText('搜索负责人')).toBeDisabled();
});
