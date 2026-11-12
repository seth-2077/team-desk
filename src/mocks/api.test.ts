import { afterAll, afterEach, beforeAll, expect, test } from 'vitest';
import { http, HttpResponse } from 'msw';
import { z } from 'zod';
import { server } from './server';
import { request } from '../shared/api';
import { envSchema } from '../shared/env';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
test('成功 HTTP 的错误响应也被运行时契约拒绝', async () => {
  server.use(
    http.get('*/api/probe', () => HttpResponse.json({ total: 'bad' })),
  );
  await expect(
    request('/probe', z.object({ total: z.number() })),
  ).rejects.toMatchObject({
    body: {
      code: 'INTERNAL',
      message: '服务响应不符合接口契约，请联系维护人员',
    },
  });
});
test('网络失败与非 JSON 错误统一反馈', async () => {
  server.use(
    http.get('*/api/network', () => HttpResponse.error()),
    http.get(
      '*/api/error',
      () => new HttpResponse('unavailable', { status: 503 }),
    ),
  );
  await expect(request('/network', z.unknown())).rejects.toMatchObject({
    status: 0,
    message: '网络连接失败，请稍后重试',
  });
  await expect(request('/error', z.unknown())).rejects.toMatchObject({
    status: 503,
    message: '服务暂不可用，请稍后重试',
  });
});
test.each([
  'ftp://example.com',
  'https://',
  '//remote.example/api',
  'https://example.com/api?q=1',
])('拒绝不合法 API 配置 %s', (url) => {
  expect(envSchema.safeParse({ VITE_API_URL: url }).success).toBe(false);
});
test('环境开关和合法后端地址经过校验', () => {
  expect(envSchema.safeParse({ VITE_MOCK: 'yes' }).success).toBe(false);
  expect(
    envSchema.parse({
      VITE_MOCK: 'false',
      VITE_API_URL: 'https://example.com/api',
    }).VITE_MOCK,
  ).toBe('false');
});
