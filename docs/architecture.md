# 架构

TeamDesk 是 React + TypeScript 单页应用，按页面就近组织代码：页面与页面私有代码就近放置，公共布局集中在 layouts，跨页面能力集中在 components、api、hooks、lib。接口契约见 [api.md](./api.md)，开发约定见 [AGENTS.md](../AGENTS.md)。

本文描述项目结构与数据边界；React 性能优化参考 [React Best Practices](../.agents/skills/vercel-react-best-practices/AGENTS.md)。本项目使用 Vite 和 TanStack Query，按适用场景采用指南。

## 模块

```text
index.html → main.tsx → router.tsx → layouts/app-layout.tsx → pages/*（页面按需懒加载）
    ├─ layouts/app-layout.tsx         Sidebar、Header、导航、内容容器与 Outlet
    ├─ pages/<domain>/*               page.tsx 入口与页面私有组件、表单、测试
    ├─ components/*                   跨页面复用组件
    ├─ api/<资源>/*                   契约、请求与 Query 配置
    ├─ hooks/*、lib/*                 通用 hooks 与工具
    └─ env.mock 时 main.tsx 加载 mocks/* → api schemas
```

- `main.tsx` / `router.tsx`：应用装配。`main.tsx` 启动 Mock（如启用）、创建 QueryClient、组合 Provider 并挂载应用；初始化逻辑较少，入口与 Router 直接留在 `src` 根目录。`router.tsx` 用 `createBrowserRouter` 集中声明路由、Loader、错误边界与懒加载；根路由以 `AppLayout` 为父级，页面挂在 `children` 中。`QueryClientProvider` 在 `main.tsx` 包裹 `RouterProvider`，布局内不重复创建 Provider。Query 默认配置以 `main.tsx` 为准。
- `layouts/`：跨页面公共布局。当前只有 `app-layout.tsx`，负责 Sidebar、Header、导航、页面内容容器、响应式外壳与 `<Outlet />`；不承载页面查询、筛选、表单或 Mutation。出现登录页或全屏编辑器等明显不同的外壳时再增加布局，不预建空布局。
- `pages/`：业务页面与页面私有实现。`<domain>/page.tsx` 是路由入口，页面私有组件、表单与单元测试直接平铺在同目录并使用业务语义命名（如 `member-form.tsx`、`member-form.test.tsx`），不建 `-components` 或通用子目录；`root.tsx` 只保留根错误边界与 404。使用 React Router Data Mode，不使用文件路由、`@react-router/dev` 或 TanStack Router 的文件命名约定；新增页面需在 `router.tsx` 注册。
- `components/`：多个页面复用的组件，允许业务语义。`ui/` 放基础 UI（Button、Dialog、Select、DataTable、Field 等）；`assignee-select.tsx`、`member-name.tsx` 是被工单和项目共同使用的业务组件。
- `api/`：按业务资源组织。`client.ts` 统一 HTTP 请求、响应校验与错误归一；`types.ts` 提供通用列表查询、分页与错误协议；`<资源>/schemas.ts` 定义契约，`requests.ts` 放纯请求函数，`queries.ts` 放 Query key 与 Query Options。
- `hooks/`：通用 hooks；`lib/`：通用工具（如 `cn.ts`）与环境配置（`env.ts`）。
- `mocks/`：MSW handlers 和内存数据，复用 `api/<资源>/schemas.ts`；用于 Mock 模式和集成测试，业务页面不导入。

## 数据流

- URL 保存列表筛选、排序和分页；路由 Loader 用资源 Zod schema 解析 `request.url` 的搜索参数，页面再用同一 schema 解析 `useSearchParams`，非法值归一为默认值。
- TanStack Query 管理服务端数据；列表路由 Loader 负责预取，与页面复用 `api/<资源>/queries.ts` 的 Query Options，页面通过 `useQuery` 读取同一缓存；React Hook Form 管理表单草稿。
- 表单校验从契约 schema 派生，只补充控件形态转换与交互校验，避免重复维护接口字段约束。
- 浏览器请求统一经 `api/client.ts`，校验响应并归一错误；MSW 在 HTTP 层拦截请求。
- Query key 按实体前缀、资源类型、参数分层定义；写操作成功后失效对应实体前缀，跨页面展示的数据也因此刷新。
- QueryOptions、Query key 和纯 API 请求函数放在 `api/<资源>/`；页面持有 `useMutation` 并定义成功后的缓存失效与页面交互。Mutation 不需要和 QueryOptions 放在同一文件，只有复用或复杂度增加时再抽成 mutation factory。
- 页面按路由懒加载；Loader 与页面的缓存新鲜度配置以代码为准，调整时需同时检查导航预取和页面重新请求的行为。应用为客户端 SPA，未配置 SSR hydration。

## 扩展规则

- 页面专属代码先放 `pages/<domain>`，文件较少时直接平铺；被多个页面复用时才提到 `components`。与业务资源相关的契约、请求和 Query 配置放 `api/<资源>`；与业务无关的 hooks 和工具放 `hooks`、`lib`。
- 目录内直接引用具体文件，不维护 `index.ts` 公开入口，也不引入 features、shared、entities、modules 等中间层。
- 单元测试和不依赖 MSW 的组件测试跟随被测文件；使用 MSW 服务端的集成测试统一放 `mocks/`（包括表单集成测试），此规则优先于就近放置；浏览器流程放 `e2e/`。
- ESLint 约束依赖方向：api 不依赖 pages / components / mocks / hooks；components 不依赖 pages / mocks；hooks 不依赖 pages / components / mocks；lib 不依赖 pages / components / api / hooks / mocks。Mock 运行时代码不应依赖 pages；`mocks/` 中的集成测试可导入页面或表单。后者目前由评审检查，尚无 ESLint 限制。ESLint 同时限制上述目录引用 features / shared，并禁止在 `api/client.ts` 之外直接调用 `fetch`。
