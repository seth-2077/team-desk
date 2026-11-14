import { z } from 'zod';

export const envSchema = z.object({
  VITE_API_URL: z
    .string()
    .refine((value) => {
      if (value.startsWith('/'))
        return !value.startsWith('//') && !/[?#]/.test(value);
      try {
        const url = new URL(value);
        return (
          ['http:', 'https:'].includes(url.protocol) &&
          !url.search &&
          !url.hash &&
          !url.username &&
          !url.password
        );
      } catch {
        return false;
      }
    }, 'API URL 必须是绝对 HTTP 地址或以 / 开头的路径')
    .default('/api'),
  VITE_MOCK: z.enum(['true', 'false']).default('true'),
});
const parsed = envSchema.parse(import.meta.env);
export const env = {
  apiUrl: parsed.VITE_API_URL.replace(/\/$/, ''),
  mock: parsed.VITE_MOCK === 'true',
};
