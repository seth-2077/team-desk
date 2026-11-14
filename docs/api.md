# API 说明

接口类型和 Zod 校验按业务资源维护在 src/api/members/schemas.ts、src/api/tickets/schemas.ts、src/api/projects/schemas.ts；通用列表查询、分页和错误结构在 src/api/types.ts；HTTP 请求与错误归一见 src/api/client.ts。

| 方法   | 路径              | 输入                                                           | 成功              |
| ------ | ----------------- | -------------------------------------------------------------- | ----------------- |
| GET    | /api/members      | 查询参数：q、page、pageSize、sort、direction、role、status     | 200 Page<Member>  |
| GET    | /api/members/:id  | 路径参数 id                                                    | 200 Member        |
| POST   | /api/members      | JSON MemberInput                                               | 201 Member        |
| PUT    | /api/members/:id  | 路径参数 id；JSON MemberInput                                  | 200 Member        |
| DELETE | /api/members/:id  | 路径参数 id                                                    | 204               |
| GET    | /api/tickets      | 查询参数：q、page、pageSize、sort、direction、status、priority | 200 Page<Ticket>  |
| POST   | /api/tickets      | JSON TicketInput                                               | 201 Ticket        |
| PUT    | /api/tickets/:id  | 路径参数 id；JSON TicketUpdate（必含 version）                 | 200 Ticket        |
| DELETE | /api/tickets/:id  | 路径参数 id                                                    | 204               |
| GET    | /api/projects     | 查询参数：q、page、pageSize、sort、direction、status           | 200 Page<Project> |
| POST   | /api/projects     | JSON ProjectInput                                              | 201 Project       |
| PUT    | /api/projects/:id | 路径参数 id；JSON ProjectInput                                 | 200 Project       |

查询参数默认值：q 为空、page 为 1、pageSize 为 10、direction 为 asc；成员 sort 默认 name，工单 sort 默认 title，项目 sort 默认 name。允许的 pageSize 为 5、10、20。列表响应为 `{ items, total, page, pageSize }`。字段与枚举、业务校验以对应 `schema.ts` 为准。

非法 URL 查询参数按 schema 恢复默认；完整列表查询条件进入 Query key。

错误 { code, message, fields?: Record<string,string> }：
422 VALIDATION / INACTIVE_ASSIGNEE / INACTIVE_OWNER / INVALID_TRANSITION；
409 DUPLICATE_EMAIL / DUPLICATE_CODE / ARCHIVED_OWNER_LOCKED / MEMBER_IN_USE / VERSION_CONFLICT；
404 NOT_FOUND；500 INTERNAL。
字段键与输入字段一致，UI 白名单回填；其他错误显示顶层并保留草稿。

真实后端必须原子校验 version 并递增，不能先读后写忽略竞态。过期返回 409，客户端不自动覆盖。
普通工单不得传 impact；故障必须填写。时间为不带时区的本地 ISO 日期时间，演示按团队 Asia/Shanghai 解释；真实后端须统一团队时区或升级为带偏移时间契约。

成员邮箱大小写归一后唯一，关联工单或负责项目的成员禁止删除；停用成员不得新指派，已有工单可保留原负责人。
状态流转由 transitions 导出，新建只能 open；closed 为终态。

项目编号去除首尾空格并统一大写后全局唯一，格式为 `TD-01`；重复返回 409 DUPLICATE_CODE。
项目负责人只能选择启用成员；未变更时保留已停用的原负责人，变更为停用成员返回 422 INACTIVE_OWNER。
已归档项目不得更换负责人，返回 409 ARCHIVED_OWNER_LOCKED；可解除归档后再次编辑负责人。

真实接入设置 VITE_MOCK=false 与 VITE_API_URL。跨域接口需正确 CORS；认证由统一请求层接入团队约定的 cookie/令牌，后端验证身份与权限。本演示不包含真实认证，生产后端不得信任前端校验。

Mock 固定初始数据，存于当前浏览器页面内存；刷新重置，不跨标签页共享，不是持久化数据库。
仅 Mock 提供 POST /api/__mock/reset 和 POST /api/__mock/scenario，后者接受 { scenario: "failure" | "conflict" | "none" }，下次保存失败或工单版本冲突；真实后端不实现这些测试端点。

## 状态机与排序

| 原状态                | 允许保存的目标状态            |
| --------------------- | ----------------------------- |
| open（待处理）        | open、in_progress、closed     |
| in_progress（处理中） | in_progress、open、resolved   |
| resolved（已解决）    | resolved、in_progress、closed |
| closed（已关闭）      | closed                        |

新建只能 open。保存同一状态允许修改其他字段。
优先级按 low < medium < high 排序，工单状态按上表顺序排序；
成员状态 active < inactive；项目状态 in_progress < archived；姓名/邮箱/标题/项目名称/编号按固定 zh-CN locale 排序。

列表 GET 支持 AbortSignal 取消。创建/更新成功响应必须满足实体 schema；
错误响应必须满足统一错误 schema，非 JSON/不合契约的响应由客户端统一报错。
Mock 路径前缀随 VITE_API_URL 配置；测试/重置端点也使用同一前缀。
