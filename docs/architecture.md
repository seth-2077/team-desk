# 架构与关键决策

## 依赖方向

app 组装 features 的公开接口；features 内包含 API/Query、页面和显式表单。
接口类型和校验跟随 features 维护；跨模块通过对方 index.ts 导入，通用能力放 shared。
shared 不依赖 features/app/mocks；通用分页和错误结构放在 shared/api-types.ts。
mocks 复用业务模块的接口类型与校验，页面不能导入 Mock。
ESLint 检查分层依赖、跨模块公开入口及 fetch 调用位置。

成员公开 AssigneeSelect、MemberName、查询工厂供工单使用。负责人名称使用同一成员 Query key，成员保存时失效 members 前缀，工单显示会更新；不在工单实体里缓存第二份成员信息。

## 三种状态

- URL：搜索、筛选、排序方向、页码和条数；Zod 校验，非法值恢复默认，筛选变化回第一页。
- Query：列表与成员详情，key 带完整查询，signal 到统一 request；不再复制到全局 store。
- RHF：表单草稿与动态检查项。用实体 key 切换编辑对象，失败和冲突不 reset。

mutation 成功后等待模块缓存失效；工单冲突时刷新列表缓存但保留当前草稿及原 version，关闭重开才获取新版本，防止静默覆盖。
删除最后一行会回退一页。排序和分页在 HTTP Mock/后端完成，不对当前页假装进行全量排序。

## 表单与 UI

DataTable 只接收数据/列/状态/回调，内部 TanStack Table v8 无请求 Hook。
FormDialog 统一标题、布局、提交中禁用、关闭与键盘焦点；Field 提供标签/说明/错误，ConfirmDelete 复用弹窗。
基础 Input/Textarea/Table 通过固定版本 shadcn CLI 从官方 registry 生成；cn 改为项目既有工具，不增加重复辅助包。
公共包装承载业务无关行为；复杂工单表单显式组合，不采用万能 JSON 配置引擎。
useSubmitErrorFocus 在控件解除禁用后聚焦服务端首个字段错误，避免 disabled 阶段聚焦失败。

成员实体 → toMemberInput → 创建/更新输入。
工单实体 → toTicketForm → RHF 草稿 → toTicketInput → HTTP 输入。
表单时间精度为分钟，HTTP 序列化补秒；普通工单转换时丢弃 impact，服务端再次拒绝普通工单的 impact。
本地时间按团队 Asia/Shanghai 解释，真实后端集成前需确认时区语义。

## HTTP 与 Mock

request 负责地址、取消、JSON、错误结构及成功响应 schema 校验。网络失败/非 JSON 错误有统一用户提示，契约不符不会被当作成功数据展示。
浏览器 MSW 拦截真实 HTTP 请求；Node 集成测试使用同一 handlers。
固定初始成员/工单存于当前页面内存，刷新重置；无随机数据、无数据库、无隐式持久化。
业务规则由服务端同样执行：唯一邮箱、关联删除、启用负责人、条件字段、时间、状态机及 version 原子检查。

## 工程选择

单包、代码式 TanStack Router，避免两个页面引入生成路由插件和额外框架。
React 19 / TypeScript 5.9 / Vite 7 稳定线，直接依赖精确版本，pnpm 版本及允许的构建脚本明确固定。
采用 Table v8；
独立 Prettier 与 ESLint，hooks 是辅助，CI 分别执行格式、lint、类型检查、测试、构建和 E2E。

当前未启用 React Compiler；保留 Table 的 Compiler 兼容性提示。
构建仍有依赖注释与入口体积提示；本项目未记录或宣称任何提效比例/性能收益。
