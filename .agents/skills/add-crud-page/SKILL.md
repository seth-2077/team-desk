---
name: add-crud-page
description: 在 TeamDesk 新增常规 CRUD 业务模块，沿用契约、HTTP Mock、Query、URL 查询状态和公共组件；不用于特殊交互页面的强制套模。
---

从 src/features/members 参考真实实现，先读 AGENTS.md、docs/api.md。

1. 在业务模块的 schema.ts 定义接口类型和必要校验；通用分页、错误结构复用 shared/api-types.ts。
2. 为 src/mocks 增加固定数据、HTTP handlers、业务校验与 reset；测试响应符合 schema。
3. 业务 api.ts 通过 src/shared/api.ts 发请求，Query key 包含完整查询，传入 signal。
4. 页面复用 shared/ui 的 DataTable、FormDialog、Field、ConfirmDelete；表格只接收数据和回调。复杂表单用显式组合。
5. 在 src/routes 创建文件路由并配置 validateSearch（routeTree.gen.ts 由插件生成）；列表查询以 URL 为主状态，筛选变化重置页码。
6. 测试 CRUD 与领域约束、字段错误、失败保留输入；需要跨模块接口时仅从 index.ts 导入。
7. 局部检查后 格式、lint、类型检查、测试和构建；涉及完整用户流程运行 pnpm test:e2e。

不要复制整个成员模块后遗留无关字段，不要求特殊页面使用同一布局。
