import { expect, test } from 'vitest';
import { env } from './env';

test('默认使用本地 Mock 接口', () => {
  expect(env).toEqual({ apiUrl: '/api', mock: true });
});
