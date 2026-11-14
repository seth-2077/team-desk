---
name: implement-business-form
description: 为 TeamDesk 新增或修改业务表单，处理输入校验、条件字段、动态列表、提交转换、服务端错误与保存失败后的草稿保留。
---

简单表单参考 `src/pages/members/member-form.tsx`；条件字段、日期转换和动态列表参考 `src/pages/tickets/ticket-form.tsx`。修改已有表单时沿用其组织方式，只调整本次需要的部分。

## 表单值与请求

接口请求和响应的 schema 放在 `src/api/<资源>/schemas.ts`。表单值、校验和提交转换按交互需要定义；新增的页面私有实现放在对应业务目录。表单与接口输入一致时直接复用接口 schema，有空字符串、日期输入或条件字段等差异时定义表单 schema，复用适用的字段约束。

用 RHF 保存输入，通过默认值转换填充编辑数据，通过提交转换生成请求。条件字段是否提交由业务规则决定，例如工单切回普通类型后不再发送 impact。动态列表沿用 `useFieldArray`，渲染使用 `field.id`，服务端返回的索引字段错误映射到当前表单路径。

## 保存与反馈

- 表单接收返回 Promise 的 `onSave`，页面负责 Mutation 和缓存失效。等待保存成功后再关闭；失败时显示错误并保留输入。
- 弹窗表单复用 Field、FormDialog，把 `isSubmitting` 传给 busy。FormDialog 已处理禁用字段、提交按钮和关闭操作；自定义受控控件仍需正确传递 disabled、ref 与 onBlur。
- 编辑弹窗沿用页面以实体 id 设置 key 的方式切换表单。缓存刷新不能覆盖正在编辑的草稿；有版本控制的接口沿用原版本提交，冲突交给用户处理。
- 从 ApiError 中提取已知字段的错误，用 `setError` 关联到控件；请求失败信息放在表单顶层。控件 id、标签与错误描述保持关联。
- 使用 `src/hooks/use-submit-error-focus.ts` 在提交结束、控件恢复可用后聚焦服务端字段错误，避免在 disabled 状态下直接调用 setFocus。

根据改动验证实际行为，例如条件切换后的请求、动态项增删、切换编辑对象、重复提交，以及失败或冲突后输入是否保留。组件测试参考 `src/pages/members/member-form.test.tsx`，HTTP 集成测试参考 `src/mocks/ticket-form.test.tsx`；按 AGENTS.md 完成检查。
