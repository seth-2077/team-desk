import { z } from 'zod';
import { listQuerySchema } from '../../shared/api-types';

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
function ticketRules(
  value: z.infer<typeof ticketFields>,
  ctx: z.RefinementCtx,
) {
  if (value.type === 'incident' && !value.impact)
    ctx.addIssue({
      code: 'custom',
      path: ['impact'],
      message: '故障工单必须填写影响范围',
    });
  if (value.dueAt < value.startsAt)
    ctx.addIssue({
      code: 'custom',
      path: ['dueAt'],
      message: '截止时间不能早于计划开始时间',
    });
  if (value.type === 'normal' && value.impact !== undefined)
    ctx.addIssue({
      code: 'custom',
      path: ['impact'],
      message: '普通工单不得提交影响范围',
    });
}
export const ticketInputSchema = ticketFields.superRefine(ticketRules);
export const ticketUpdateSchema = ticketFields
  .extend({ version: z.number().int().positive() })
  .superRefine(ticketRules);
export const ticketSchema = ticketFields
  .extend({ id: z.string(), version: z.number().int().positive() })
  .superRefine(ticketRules);
export type Ticket = z.infer<typeof ticketSchema>;
export type TicketInput = z.infer<typeof ticketInputSchema>;
export type TicketUpdate = z.infer<typeof ticketUpdateSchema>;

export const ticketQuerySchema = listQuerySchema.extend({
  status: ticketStatusSchema.or(z.literal('')).catch('').default(''),
  priority: prioritySchema.or(z.literal('')).catch('').default(''),
  sort: z.enum(['title', 'status', 'priority']).catch('title').default('title'),
});
export type TicketQuery = z.infer<typeof ticketQuerySchema>;
