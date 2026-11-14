/**
 * 把 Zod 解析后的查询对象序列化为 URLSearchParams。
 *
 * 由 schema 的 `.parse` 结果驱动，因此非法参数会先被归一为默认值；
 * 保持字段插入顺序，避免同一状态的 URL 在不同入口下出现无意义差异。
 */
import type { ZodType } from 'zod';

type QueryValue = string | number | boolean | null | undefined;

export function toSearchParams(
  query: Record<string, QueryValue>,
): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) continue;
    params.set(key, String(value));
  }
  return params;
}

export function hrefWithSearch(
  pathname: string,
  query: Record<string, QueryValue>,
) {
  const search = toSearchParams(query).toString();
  return search ? `${pathname}?${search}` : pathname;
}

/**
 * 合并一次列表查询变更，保持 TanStack navigate(search) 的 URL 语义：
 * 只保留原有参数与真正变化的参数，不把 schema 默认值铺进 URL；
 * 同时把已有非法值规范化为默认值。
 */
export function mergeSearchParams<T extends Record<string, QueryValue>>(
  previous: URLSearchParams,
  schema: ZodType<T>,
  patch: Partial<T>,
): URLSearchParams {
  const current = schema.parse(Object.fromEntries(previous));
  const next = schema.parse({ ...current, page: 1, ...patch });
  const result = new URLSearchParams(previous);
  for (const [key, value] of Object.entries(next)) {
    const raw = previous.get(key);
    if (raw === null && value === current[key]) continue;
    if (raw !== null && raw === String(value)) continue;
    result.set(key, String(value));
  }
  return result;
}
