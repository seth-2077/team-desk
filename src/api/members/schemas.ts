import { z } from 'zod';
import { listQuerySchema } from '../types';

export const roleSchema = z.enum(['admin', 'agent', 'viewer']);
export const memberStatusSchema = z.enum(['active', 'inactive']);
export const memberInputSchema = z.object({
  name: z.string().trim().min(1, '请输入姓名').max(60),
  email: z.email('请输入有效邮箱').transform((v) => v.toLowerCase()),
  role: roleSchema,
  status: memberStatusSchema,
});
export const memberSchema = memberInputSchema.extend({ id: z.string() });
export type Member = z.infer<typeof memberSchema>;
export type MemberInput = z.infer<typeof memberInputSchema>;

export const memberQuerySchema = listQuerySchema.extend({
  role: roleSchema.or(z.literal('')).catch('').default(''),
  status: memberStatusSchema.or(z.literal('')).catch('').default(''),
  sort: z.enum(['name', 'email', 'status']).catch('name').default('name'),
});
export type MemberQuery = z.infer<typeof memberQuerySchema>;
