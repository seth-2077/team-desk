import { z } from 'zod';
import { listQuerySchema } from '../types';

export const projectStatusSchema = z.enum(['in_progress', 'archived']);
export const projectCodeSchema = z
  .string()
  .trim()
  .min(1, '请输入项目编号')
  .max(8)
  .transform((value) => value.toUpperCase())
  .pipe(z.string().regex(/^TD-\d{2}$/, '编号格式为 TD-01'));
export const projectInputSchema = z.object({
  name: z.string().trim().min(1, '请输入项目名称').max(80),
  code: projectCodeSchema,
  status: projectStatusSchema,
  ownerId: z.string().min(1, '请选择负责人'),
});
export const projectSchema = projectInputSchema.extend({ id: z.string() });
export type Project = z.infer<typeof projectSchema>;
export type ProjectInput = z.infer<typeof projectInputSchema>;

export const projectQuerySchema = listQuerySchema.extend({
  status: projectStatusSchema.or(z.literal('')).catch('').default(''),
  sort: z.enum(['name', 'code', 'status']).catch('name').default('name'),
});
export type ProjectQuery = z.infer<typeof projectQuerySchema>;
