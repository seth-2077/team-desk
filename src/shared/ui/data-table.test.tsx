import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, test, vi } from 'vitest';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from './data-table';

afterEach(cleanup);
const columns: ColumnDef<{ name: string }>[] = [
  { accessorKey: 'name', header: '姓名' },
];
test('展示加载、空态和错误重试', async () => {
  const retry = vi.fn();
  const props = { columns, onRetry: retry, onPage: vi.fn() };
  const view = render(<DataTable {...props} loading />);
  expect(screen.getByRole('status')).toHaveTextContent('加载中');
  view.rerender(<DataTable {...props} loading={false} />);
  expect(screen.getByText(/没有匹配的数据/)).toBeVisible();
  view.rerender(<DataTable {...props} loading={false} error="请求失败" />);
  expect(screen.getByRole('alert')).toHaveTextContent('请求失败');
  await userEvent.click(screen.getByRole('button', { name: '重试' }));
  expect(retry).toHaveBeenCalledOnce();
});
test('分页回调由外部驱动，边界按钮禁用', async () => {
  const onPage = vi.fn();
  const props = { columns, onRetry: vi.fn(), onPage, loading: false };
  const view = render(
    <DataTable
      {...props}
      result={{ items: [{ name: '首项' }], total: 6, page: 1, pageSize: 5 }}
    />,
  );
  expect(screen.getByRole('cell', { name: '首项' })).toBeVisible();
  expect(screen.getByRole('button', { name: '上一页' })).toBeDisabled();
  await userEvent.click(screen.getByRole('button', { name: '下一页' }));
  expect(onPage).toHaveBeenCalledWith(2);
  view.rerender(
    <DataTable
      {...props}
      result={{ items: [{ name: '末项' }], total: 6, page: 2, pageSize: 5 }}
    />,
  );
  expect(screen.getByRole('button', { name: '下一页' })).toBeDisabled();
});
