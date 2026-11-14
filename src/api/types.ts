import { z } from 'zod';

export const listQuerySchema = z.object({
  q: z.string().catch('').default(''),
  page: z.coerce.number().int().min(1).catch(1).default(1),
  pageSize: z.coerce
    .number()
    .pipe(z.union([z.literal(5), z.literal(10), z.literal(20)]))
    .catch(10)
    .default(10),
  direction: z.enum(['asc', 'desc']).catch('asc').default('asc'),
});
export const pageSchema = <T extends z.ZodType>(item: T) =>
  z.object({
    items: z.array(item),
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
  });
export type Page<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};
export const errorSchema = z.object({
  code: z.string().min(1),
  message: z.string(),
  fields: z.record(z.string(), z.string()).optional(),
});
export type ApiErrorBody = z.infer<typeof errorSchema>;
