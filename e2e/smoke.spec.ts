import { test, expect } from '@playwright/test';

test('应用启动并通过 HTTP Mock 完成成员创建', async ({ page }) => {
  await page.goto('/members');
  await expect(page.getByRole('heading', { name: '成员管理' })).toBeVisible();
  await expect(
    page.getByRole('cell', { name: 'lin@teamdesk.dev' }),
  ).toBeVisible();
  await page.getByRole('button', { name: '新增成员' }).click();
  await page.getByLabel('姓名', { exact: true }).fill('演练成员');
  await page.getByLabel('邮箱', { exact: true }).fill('harness@teamdesk.dev');
  await page.getByRole('button', { name: '保存', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(
    page.getByRole('cell', { name: 'harness@teamdesk.dev' }),
  ).toBeVisible();
});
