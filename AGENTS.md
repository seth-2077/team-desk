# TeamDesk

团队工单管理后台，包含成员管理与工单协作。

## 技术栈

- React + TypeScript 单包项目，使用 Vite；pnpm 11.24.0，Node 24。
- React Router 7 Data Mode（`createBrowserRouter` + `RouterProvider`）、TanStack Query / Table、React Hook Form + Zod、shadcn/ui + Tailwind CSS。

## 工作约定

- 新增页面、调整目录或数据流前阅读 [架构文档](docs/architecture.md)，按其中的目录职责、依赖方向与测试归属实现。
- 改动接口前阅读 [接口契约](docs/api.md)；接口变更同步更新资源 schema、请求、Mock 和接口文档。
- HTTP 请求统一经过 `src/api/client.ts`；URL 管理列表查询，TanStack Query 管理服务端数据，RHF 管理表单草稿，不另行复制服务端数据到状态容器。
- 新增实现前检查现有代码，优先复用 DataTable、FormDialog、Field、ConfirmDelete；复杂表单采用显式组合，不为单次使用的简单逻辑强制抽象。
- 只调整当前任务需要的代码，不顺便重构无关业务；目录与命名保持稳定，实际维护问题出现时再调整。

## 命令与完成标准

- 开发：`pnpm dev`；局部检查：`pnpm test`、`pnpm typecheck`。
- 交付前运行 `pnpm format:check`、`pnpm lint`、`pnpm typecheck`、`pnpm test`、`pnpm build`。
- 涉及路由、接口/Mock、业务交互或构建配置时，再运行 `pnpm test:e2e`。
- 检查失败先修复，无法解决时如实说明阻塞，不得声称完成。
- 修复使用 `pnpm format`、`pnpm lint:fix`；不得通过关闭规则或删除测试绕过问题。
- 业务规则变更补充相关测试，测试归属见架构文档。
- 与用户用中文交流，说明实际改动和验证结果。

## Skills

Skills 统一维护在 `.agents/skills`；新增时为 Claude Code 建立对应的相对软链接，不复制文件：

```sh
ln -s ../../.agents/skills/<name> .claude/skills/<name>
```

## Git

- 不得自动创建分支、工作树或提交；只有用户在当前请求中明确要求执行对应操作时，才可执行。
- 修改保留在当前分支的工作区中，不自动提交，由用户决定何时以及如何提交。
