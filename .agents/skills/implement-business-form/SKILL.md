---
name: implement-business-form
description: 实现或修改 TeamDesk 业务表单的校验、联动、数据转换、服务端字段错误和失败草稿保留。
---

参考 src/features/members/member-form.tsx，复杂条件与动态列表参考 src/features/tickets/ticket-form.tsx。

- 先列业务规则与服务端同样必须执行的约束，再定义业务模块 schema 和独立表单值；UI 草稿由 React Hook Form 管理。
- 明确 entity → form → input 转换。隐藏的条件字段不能混入请求；不要用万能配置表单引擎。
- 使用 Field、FormDialog；id、标签、错误关联可访问；提交期间禁用按钮及关闭操作。
- 切换编辑实体通过 keyed form 重新挂载；同一实体保存失败或版本冲突不重置表单。不要自动用新版本覆盖用户草稿或自动重试冲突。
- 字段错误只映射允许的表单字段，未知错误在表单顶层显示；查询与 mutation 成功后精准失效相关缓存。
- 补充条件字段、编辑切换、重复提交、失败保留、业务冲突测试，先局部运行再 格式、lint、类型检查、测试和构建；记录实际检查结果。

服务端错误聚焦参考 src/shared/use-submit-error-focus.ts：提交回调内仍处于 disabled 状态，需要在提交结束后聚焦，不能直接忽略焦点测试。
