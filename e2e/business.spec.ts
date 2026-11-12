import { test, expect, type Page, type Locator } from '@playwright/test';

async function choose(page: Page, control: Locator, label: string) {
  await control.click();
  await page.getByRole('option', { name: label, exact: true }).click();
}

async function createMember(page: Page, name: string, email: string) {
  await page.getByRole('button', { name: '新增成员' }).click();
  await page.getByLabel('姓名', { exact: true }).fill(name);
  await page.getByLabel('邮箱', { exact: true }).fill(email);
  await page.getByRole('button', { name: '保存', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
}
async function scenario(page: Page, value: 'failure' | 'conflict') {
  await page.evaluate(async (scenario) => {
    const response = await fetch('/api/__mock/scenario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario }),
    });
    if (!response.ok) throw new Error('设置 Mock 演练场景失败');
  }, value);
}
test('成员 CRUD、重复邮箱、筛选和关联删除保护', async ({ page }) => {
  await page.goto('/members');
  await expect(
    page.getByRole('cell', { name: 'lin@teamdesk.dev' }),
  ).toBeVisible();
  await createMember(page, '演练成员', 'member@example.com');
  const row = page.getByRole('row').filter({ hasText: 'member@example.com' });
  await row.getByRole('button', { name: '编辑' }).click();
  await page.getByLabel('邮箱', { exact: true }).fill('LIN@teamdesk.dev');
  await page.getByRole('button', { name: '保存', exact: true }).click();
  await expect(page.getByText('该邮箱已被使用', { exact: true })).toBeVisible();
  await expect(page.getByLabel('姓名', { exact: true })).toHaveValue(
    '演练成员',
  );
  await page.getByLabel('邮箱', { exact: true }).fill('member@example.com');
  await page.getByLabel('姓名', { exact: true }).fill('更新成员');
  await choose(page, page.getByLabel('状态', { exact: true }), '停用');
  await page.getByRole('button', { name: '保存', exact: true }).click();
  await expect(row).toContainText('停用');
  await choose(page, page.getByLabel('状态筛选'), '停用');
  await page.getByLabel('搜索成员').fill('更新成员');
  await expect(
    page.getByRole('row').filter({ hasText: 'member@example.com' }),
  ).toBeVisible();
  await expect(page).toHaveURL(/status=inactive/);
  await row.getByRole('button', { name: '编辑' }).click();
  await choose(page, page.getByLabel('状态', { exact: true }), '启用');
  await page.getByRole('button', { name: '保存', exact: true }).click();
  await expect(row).toHaveCount(0);
  await choose(page, page.getByLabel('状态筛选'), '全部状态');
  await expect(row).toContainText('启用');
  await row.getByRole('button', { name: '删除' }).click();
  await page.getByRole('button', { name: '确认删除', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(row).toHaveCount(0);
  await page.getByLabel('搜索成员').fill('');
  const linked = page.getByRole('row').filter({ hasText: 'chen@teamdesk.dev' });
  await linked.getByRole('button', { name: '删除' }).click();
  await page.getByRole('button', { name: '确认删除', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText(
    '该成员有关联工单，不能删除',
  );
  await page.getByRole('button', { name: '取消', exact: true }).click();
  await expect(linked).toBeVisible();
});
test('关联成员的工单 CRUD、条件转换、动态项与历史停用负责人', async ({
  page,
}) => {
  await page.goto('/members');
  await expect(
    page.getByRole('cell', { name: 'lin@teamdesk.dev' }),
  ).toBeVisible();
  await createMember(page, '工单负责人', 'owner@example.com');
  await page.getByRole('link', { name: '工单管理' }).click();
  await page.getByRole('button', { name: '新增工单' }).click();
  await page.getByLabel('工单标题').fill('交付流程演练');
  await page.getByLabel('描述', { exact: true }).fill('演练工单完整生命周期');
  await choose(page, page.getByLabel('工单类型'), '故障工单');
  await page.getByLabel('影响范围').fill('团队协作');
  await page.getByLabel('搜索负责人').fill('owner@');
  await choose(
    page,
    page.getByLabel('负责人', { exact: true }),
    '工单负责人 · owner@example.com',
  );
  await page.getByLabel('计划开始时间').fill('2026-11-12T09:00');
  await page.getByLabel('截止时间').fill('2026-11-13T18:00');
  await page.getByRole('button', { name: '添加检查项' }).click();
  await page.getByLabel('检查项 1', { exact: true }).fill('完成验收');
  const createRequest = page.waitForRequest(
    (request) =>
      request.method() === 'POST' &&
      new URL(request.url()).pathname === '/api/tickets',
  );
  await page.getByRole('button', { name: '保存', exact: true }).click();
  const input: unknown = (await createRequest).postDataJSON();
  expect(input).toMatchObject({
    type: 'incident',
    impact: '团队协作',
    checklist: [{ text: '完成验收', done: false }],
  });
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const row = page.getByRole('row').filter({ hasText: '交付流程演练' });
  await expect(row).toContainText('工单负责人');
  await row.getByRole('button', { name: '编辑' }).click();
  await choose(page, page.getByLabel('工单类型'), '普通工单');
  await choose(page, page.getByLabel('工单状态', { exact: true }), '处理中');
  await page.getByLabel('完成检查项 1').check();
  const updateRequest = page.waitForRequest(
    (request) =>
      request.method() === 'PUT' &&
      new URL(request.url()).pathname.startsWith('/api/tickets/'),
  );
  await page.getByRole('button', { name: '保存', exact: true }).click();
  const update: unknown = (await updateRequest).postDataJSON();
  expect(update).not.toHaveProperty('impact');
  expect(update).toMatchObject({ version: 1, status: 'in_progress' });
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('link', { name: '成员管理' }).click();
  const memberRow = page
    .getByRole('row')
    .filter({ hasText: 'owner@example.com' });
  await memberRow.getByRole('button', { name: '编辑' }).click();
  await choose(page, page.getByLabel('状态', { exact: true }), '停用');
  await page.getByRole('button', { name: '保存', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('link', { name: '工单管理' }).click();
  await expect(row).toContainText('工单负责人（已停用）');
  await row.getByRole('button', { name: '编辑' }).click();
  await page.getByLabel('负责人', { exact: true }).click();
  await expect(
    page.getByRole('option', { name: '工单负责人（已停用，历史负责人）' }),
  ).toBeAttached();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: '保存', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: '新增工单' }).click();
  await page.getByLabel('负责人', { exact: true }).click();
  await expect(page.getByRole('option', { name: /林晓/ })).toBeAttached();
  await expect(page.getByRole('option', { name: /工单负责人/ })).toHaveCount(0);
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: '取消', exact: true }).click();
  await page.screenshot({
    path: 'test-results/tickets-desktop.png',
    fullPage: true,
  });
  await row.getByRole('button', { name: '删除' }).click();
  await page.getByRole('button', { name: '确认删除', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(row).toHaveCount(0);
  await page.getByRole('link', { name: '成员管理' }).click();
  await memberRow.getByRole('button', { name: '删除' }).click();
  await page.getByRole('button', { name: '确认删除', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(memberRow).toHaveCount(0);
});
test('失败与并发冲突保留输入，重新打开使用最新版本', async ({ page }) => {
  await page.goto('/tickets');
  const row = page.getByRole('row').filter({ hasText: '排查支付回调延迟' });
  await row.getByRole('button', { name: '编辑' }).click();
  await page.getByLabel('工单标题').fill('尚未保存的故障标题');
  await scenario(page, 'failure');
  await page.getByRole('button', { name: '保存', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('保存失败');
  await expect(page.getByLabel('工单标题')).toHaveValue('尚未保存的故障标题');
  await scenario(page, 'conflict');
  await page.getByRole('button', { name: '保存', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('已被他人修改');
  await expect(page.getByLabel('工单标题')).toHaveValue('尚未保存的故障标题');
  await page.getByRole('button', { name: '取消', exact: true }).click();
  await row.getByRole('button', { name: '编辑' }).click();
  await expect(page.getByLabel('工单标题')).toHaveValue('排查支付回调延迟');
  await expect(page.getByText(/版本 2/)).toBeVisible();
  await page.getByLabel('工单标题').fill('合并后保存成功');
  await page.getByRole('button', { name: '保存', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(
    page.getByRole('cell', { name: /合并后保存成功/ }),
  ).toBeVisible();
});

test('非法 URL 恢复默认、筛选刷新保留与键盘焦点可用', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/tickets?page=-9&pageSize=bad&status=unknown&sort=bad');
  await expect(
    page.getByRole('row').filter({ hasText: '排查支付回调延迟' }),
  ).toBeVisible();
  await expect(page.getByLabel('每页条数')).toHaveText('10 条 / 页');
  await choose(page, page.getByLabel('优先级筛选'), '高');
  await page.getByLabel('搜索工单').fill('支付');
  await expect(
    page.getByRole('row').filter({ hasText: '更新团队使用手册' }),
  ).toHaveCount(0);
  await page.reload();
  await expect(page.getByLabel('搜索工单')).toHaveValue('支付');
  await expect(page.getByLabel('优先级筛选')).toHaveText('高');
  await expect(
    page.getByRole('row').filter({ hasText: '排查支付回调延迟' }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: '工单管理' })).toHaveAttribute(
    'aria-current',
    'page',
  );
  const trigger = page.getByRole('button', { name: '新增工单' });
  await trigger.click();
  await expect(page.getByLabel('工单标题')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(trigger).toBeFocused();
  const width = await page.evaluate(() => ({
    document: document.documentElement.scrollWidth,
    viewport: window.innerWidth,
  }));
  expect(width.document).toBeLessThanOrEqual(width.viewport);
  await page.screenshot({
    path: 'test-results/tickets-mobile.png',
    fullPage: true,
  });
});

test('下拉菜单支持键盘选择、排序分页与弹窗内 Escape', async ({ page }) => {
  await page.goto('/members');
  const role = page.getByRole('combobox', { name: '角色筛选' });
  await role.focus();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('listbox')).toBeVisible();
  await page.screenshot({
    path: 'test-results/select-menu.png',
    fullPage: true,
  });
  await page.keyboard.press('End');
  await page.keyboard.press('Enter');
  await expect(role).toHaveText('观察者');
  await expect(page).toHaveURL(/role=viewer/);
  await choose(page, role, '全部角色');
  await choose(page, page.getByLabel('排序字段'), '按邮箱排序');
  await choose(page, page.getByLabel('每页条数'), '5 条 / 页');
  await expect(page).toHaveURL(/sort=email/);
  await expect(page).toHaveURL(/pageSize=5/);
  await page.getByRole('button', { name: '新增成员' }).click();
  const status = page.getByLabel('状态', { exact: true });
  await status.click();
  await expect(page.getByRole('listbox')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('listbox')).toHaveCount(0);
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(status).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
