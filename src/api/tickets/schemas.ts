import { z } from 'zod';
import { listQuerySchema } from '../types';

export const ticketStatusSchema = z.enum([
  'open',
  'in_progress',
  'resolved',
  'closed',
]);
export const prioritySchema = z.enum(['low', 'medium', 'high']);
export const transitions: Record<
  z.infer<typeof ticketStatusSchema>,
  readonly z.infer<typeof ticketStatusSchema>[]
> = {
  open: ['open', 'in_progress', 'closed'],
  in_progress: ['in_progress', 'open', 'resolved'],
  resolved: ['resolved', 'in_progress', 'closed'],
  closed: ['closed'],
};
const ticketFields = z.object({
  title: z.string().trim().min(1, '请输入标题').max(120),
  description: z.string().max(2000),
  type: z.enum(['normal', 'incident']),
  impact: z.string().trim().max(500).optional(),
  status: ticketStatusSchema,
  priority: prioritySchema,
  assigneeId: z.string().min(1, '请选择负责人'),
  startsAt: z.iso.datetime({ local: true }),
  dueAt: z.iso.datetime({ local: true }),
  checklist: z
    .array(
      z.object({
        text: z.string().trim().min(1, '请输入检查项'),
        done: z.boolean(),
      }),
    )
    .max(20),
});
type TicketRuleShape = {
  type: 'normal' | 'incident';
  impact?: string;
  startsAt: string;
  dueAt: string;
};
function impactRequiredForIncident(
  value: TicketRuleShape,
  ctx: z.RefinementCtx,
) {
  if (value.type === 'incident' && !value.impact?.trim())
    ctx.addIssue({
      code: 'custom',
      path: ['impact'],
      message: '故障工单必须填写影响范围',
    });
}
function timeOrder(
  value: { startsAt: string; dueAt: string },
  ctx: z.RefinementCtx,
) {
  if (value.dueAt < value.startsAt)
    ctx.addIssue({
      code: 'custom',
      path: ['dueAt'],
      message: '截止时间不能早于计划开始时间',
    });
}
function ticketRules(value: TicketRuleShape, ctx: z.RefinementCtx) {
  impactRequiredForIncident(value, ctx);
  timeOrder(value, ctx);
  if (value.type === 'normal' && value.impact !== undefined)
    ctx.addIssue({
      code: 'custom',
      path: ['impact'],
      message: '普通工单不得提交影响范围',
    });
}
function formRules(value: TicketRuleShape, ctx: z.RefinementCtx) {
  impactRequiredForIncident(value, ctx);
  timeOrder(value, ctx);
}
export const ticketInputSchema = ticketFields.superRefine(ticketRules);
export const ticketUpdateSchema = ticketFields
  .extend({ version: z.number().int().positive() })
  .superRefine(ticketRules);
export const ticketSchema = ticketFields
  .extend({ id: z.string(), version: z.number().int().positive() })
  .superRefine(ticketRules);
// 表单值与契约输入形态不同：impact 常驻字符串、时间只到分钟。
// 字段约束从 ticketFields 派生，只覆盖这三处差异，不重复书写其余字段。
export const ticketFormSchema = ticketFields
  .extend({
    impact: z.string().max(500),
    startsAt: z.iso.datetime({
      local: true,
      precision: -1,
      error: '请选择有效的计划开始时间',
    }),
    dueAt: z.iso.datetime({
      local: true,
      precision: -1,
      error: '请选择有效的截止时间',
    }),
    checklist: ticketFields.shape.checklist.max(20, '最多 20 个检查项'),
  })
  .superRefine(formRules);
export type Ticket = z.infer<typeof ticketSchema>;
export type TicketFormValues = z.infer<typeof ticketFormSchema>;
export type TicketInput = z.infer<typeof ticketInputSchema>;
export type TicketUpdate = z.infer<typeof ticketUpdateSchema>;

export const ticketQuerySchema = listQuerySchema.extend({
  status: ticketStatusSchema.or(z.literal('')).catch('').default(''),
  priority: prioritySchema.or(z.literal('')).catch('').default(''),
  sort: z.enum(['title', 'status', 'priority']).catch('title').default('title'),
});
export type TicketQuery = z.infer<typeof ticketQuerySchema>;
