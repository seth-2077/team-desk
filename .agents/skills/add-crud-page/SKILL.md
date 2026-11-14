---
name: add-crud-page
description: 为 TeamDesk 新增业务资源的列表、新建、编辑和删除功能，接入接口契约、HTTP Mock、Query 缓存与 URL 查询状态。
---

参考 `src/pages/members/page.tsx` 和 `src/api/members/` 实现常规 CRUD；有关联选择或业务约束时，参考 projects 与 tickets 中对应的实现，按需求选择功能。

## 接入资源

- 在 `src/api/<资源>/` 定义 schemas、requests 和 queries；分页与错误协议复用 `src/api/types.ts`，请求经过 `src/api/client.ts`。
- 列表 Query key 包含 schema 归一后的查询参数，queryFn 把 signal 传给请求。页面和 Loader 使用同一份 Query Options。
- 在现有 Mock store、handlers 和 reset 中接入资源。唯一性、关联删除保护等服务端规则应在 HTTP 层执行，不能只靠页面校验。

## 组装页面

- 在 `src/router.tsx` 注册懒加载页面和列表 Loader；需要侧栏入口时更新 `src/layouts/app-layout.tsx` 的导航。
- 查询参数通过资源 schema 解析，使用 `useSearchParams` 和 `mergeSearchParams` 更新。筛选、排序和每页条数改变时回到第一页；翻页保留当前查询。
- 复用 SearchInput、SelectControl、DataTable、FormDialog 和 ConfirmDelete 的现有接口。列表呈现加载、空态和错误重试；表单实现采用 `implement-business-form` 的指导。
- 保存和删除由页面 Mutation 处理，成功后失效资源的 Query key 前缀；有关联展示时，检查依赖方的缓存是否也需要刷新。
- 删除失败保留确认框并显示错误；删除当前页最后一项后，若还有上一页则回退一页。重新打开删除确认框时清除上一次 Mutation 错误。

验证新资源的 CRUD、URL 查询恢复和实际业务约束。接口与 Mock 测试参考 `src/mocks/members.test.ts`，浏览器流程参考 `e2e/business.spec.ts`；按 AGENTS.md 完成检查。
