# TeamDesk

React + TypeScript 团队工单管理后台，使用 MSW 提供本地接口。

## 启动

Node 24.x，pnpm 11.24.0：

```sh
corepack enable
pnpm install --frozen-lockfile
cp .env.example .env
pnpm dev
```

## 功能

- 成员增删改查、搜索筛选、排序分页、启用/停用。
- 邮箱重复错误回填，关联工单的成员不可删除。
- 工单增删改查、搜索筛选、排序分页、异步搜索负责人。
- 故障影响范围、动态检查项、时间校验、状态流转、版本冲突。
- 保存失败保留表单输入，历史停用负责人正常展示。

## 开发命令

| 命令                       | 用途                  |
| -------------------------- | --------------------- |
| pnpm dev                   | 本地开发              |
| pnpm format / format:check | 修复 / 检查格式       |
| pnpm lint:fix / lint       | 修复 / 检查 ESLint    |
| pnpm typecheck             | 类型检查              |
| pnpm test / test:watch     | 测试 / 监听测试       |
| pnpm test:e2e              | Playwright 浏览器测试 |
| pnpm build                 | 生产构建              |

首次运行浏览器测试前执行：

```sh
pnpm exec playwright install chromium
```

Git 提交前通过 Husky 和 lint-staged 检查暂存文件。仓库当前未配置 CI workflow；需要在本地按 AGENTS.md 执行格式、lint、类型检查、测试、构建，并在路由、接口/Mock、业务交互或构建配置改动时运行 E2E。

## 接口与 Mock

默认 VITE_MOCK=true，数据存于当前页面内存，刷新重置。
设置 VITE_MOCK=false、VITE_API_URL 接入真实后端。

[架构说明](docs/architecture.md) · [接口说明](docs/api.md)

路由 loader 通过 QueryClient 预取当前 URL 对应的列表数据；QueryOptions 和 query key 位于业务模块 `api.ts`，页面管理 mutation 和页面反馈。详细数据边界与扩展规则见架构说明。

## 项目约定

AGENTS.md 为项目开发约定，CLAUDE.md 引入同一份内容。
Skills 存于 .agents/skills，.claude/skills 使用相对符号链接共享。

当前不包含真实认证、多租户、复杂权限与持久化。
浏览器测试覆盖 Chromium；真实后端、其他浏览器及远端 CI 尚未实测。
