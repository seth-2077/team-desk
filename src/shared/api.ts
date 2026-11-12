import { z } from 'zod';
import { errorSchema, type ApiErrorBody } from './api-types';
import { env } from './env';

export class ApiError extends Error {
  constructor(
    public body: ApiErrorBody,
    public status: number,
    options?: ErrorOptions,
  ) {
    super(body.message, options);
  }
}
export async function request<T>(
  path: string,
  schema: z.ZodType<T>,
  options: RequestInit = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(env.apiUrl + path, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers },
    });
  } catch (error) {
    if (options.signal?.aborted) throw error;
    throw new ApiError(
      { code: 'INTERNAL', message: '网络连接失败，请稍后重试' },
      0,
      { cause: error },
    );
  }
  if (!response.ok) {
    const parsed = errorSchema.safeParse(
      await response.json().catch(() => null),
    );
    throw new ApiError(
      parsed.success
        ? parsed.data
        : { code: 'INTERNAL', message: '服务暂不可用，请稍后重试' },
      response.status,
    );
  }
  const body: unknown =
    response.status === 204
      ? undefined
      : await response.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success)
    throw new ApiError(
      { code: 'INTERNAL', message: '服务响应不符合接口契约，请联系维护人员' },
      response.status,
      { cause: parsed.error },
    );
  return parsed.data;
}
export function queryString(query: object) {
  return new URLSearchParams(
    Object.entries(query).map(([k, v]) => [k, String(v)]),
  ).toString();
}
export const emptyResponse = z.undefined();
export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : '发生未知错误，请稍后重试';
}
