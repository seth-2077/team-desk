# 架构

TeamDesk 是 React + TypeScript 单页应用。接口契约见 [api.md](./api.md)，开发约定见 [AGENTS.md](../AGENTS.md)。

本文描述项目结构与数据边界；React 性能优化参考 [React Best Practices](../.agents/skills/vercel-react-best-practices/AGENTS.md)。本项目使用 Vite 和 TanStack Query，按适用场景采用指南；跨 feature 的 `index.ts` 公开入口保留，feature 内直接引用具体文件。

## 模块

```text
main.tsx → routeTree.gen.ts → routes/* → features/* → shared/*
    └─ env.mock 时加载 mocks/* → feature schemas + shared

features/tickets → features/members/index.ts
shared 不依赖 routes、features 或 mocks
```

- `main.tsx`：创建 QueryClient 和 Router，挂载应用；Mock 模式下启动 MSW。
- `routes/`：文件路由、布局、URL 校验与重定向；`routeTree.gen.ts` 自动生成，不手改。
- `features/<业务>/`：`schema.ts` 定义契约，`api.ts` 提供请求与 Query 配置，`page.tsx` 编排页面，`components/` 放业务组件与表单，`index.ts` 声明公开能力。业务 hooks 有复用需求时再建 `hooks/`。
- `shared/`：`ui/` 放通用 UI，`hooks/` 放通用 hooks，`utils/` 按用途命名纯函数文件（如 `cn.ts`）；请求、通用协议与环境配置分别在 `api.ts`、`api-types.ts`、`env.ts`。
- `mocks/`：MSW handlers 和内存数据，复用 feature schema；用于 Mock 模式和集成测试，业务页面不导入。

## 数据流

- URL 保存列表筛选、排序和分页；路由用 Zod schema 校验搜索参数。
- TanStack Query 管理服务端数据；React Hook Form 管理表单草稿。
- 浏览器请求统一经 `shared/api.ts`，校验响应并归一错误；MSW 在 HTTP 层拦截请求。
- 修改接口时同步更新 feature schema、Mock handlers 和 `docs/api.md`。

## 扩展规则

- 先把代码放在所属 feature；被多个业务复用且不含业务语义的能力再提到 shared。目录内直接导入具体文件，跨 feature 仅通过 `index.ts`。
- 测试跟随被测组件；依赖 MSW 的集成测试放 `mocks/`，浏览器流程放 `e2e/`。
- ESLint 自动发现 feature，禁止跨模块深层导入、shared 依赖上层，以及 feature 依赖路由、启动入口或 mocks。新增业务无需手动登记模块名单。
