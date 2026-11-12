# TeamDesk

团队工单管理后台，包含成员管理与工单协作。

## 技术栈

- React + TypeScript 单包项目，使用 Vite；pnpm 11.24.0，Node 24。
- TanStack Router / Query / Table、React Hook Form + Zod、shadcn/ui + Tailwind CSS。

## 架构约定

- 接口类型与校验放在各业务模块的 `schema.ts`；新增或修改接口时，同步更新 `src/mocks` 和 `docs/api.md`。
- `src/features` 按业务划分，跨模块只通过 `index.ts`；`src/shared` 不依赖业务模块。
- HTTP 请求统一经过 `src/shared/api.ts`，页面和组件不直接调用 `fetch`。
- URL 管理列表查询，Query 管理服务端数据，RHF 管理表单草稿；不要将服务端数据另存到 `useState` 或全局 store。
- 复用 DataTable、FormDialog、Field、ConfirmDelete；复杂表单采用显式组合。
- 改动接口前阅读 `docs/api.md`；新增模块或调整分层前阅读 `docs/architecture.md`。

## 命令与完成标准

- 开发：`pnpm dev`；局部检查：`pnpm test`、`pnpm typecheck`。
- 交付前运行 `pnpm format:check`、`pnpm lint`、`pnpm typecheck`、`pnpm test`、`pnpm build`。
- 涉及路由、接口/Mock、业务交互或构建配置时，再运行 `pnpm test:e2e`。
- 检查失败先修复，无法解决时如实说明阻塞，不得声称完成。
- 修复使用 `pnpm format`、`pnpm lint:fix`；不得通过关闭规则或删除测试绕过问题。
- 业务规则变更补充相关测试：Vitest / Testing Library 测试放在 `src`，使用 Mock 服务端的集成测试放在 `src/mocks`，E2E 放在 `e2e`。
- 与用户用中文交流，说明实际改动和验证结果。

## Skills

Skills 统一维护在 `.agents/skills`；新增时为 Claude Code 建立对应的相对软链接，不复制文件：

```sh
ln -s ../../.agents/skills/<name> .claude/skills/<name>
```

## Git

- 不得自动创建分支、工作树或提交；只有用户在当前请求中明确要求执行对应操作时，才可执行。
- 修改保留在当前分支的工作区中，不自动提交，由用户决定何时以及如何提交。
