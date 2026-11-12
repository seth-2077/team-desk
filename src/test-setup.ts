import '@testing-library/jest-dom/vitest';
import { transferableAbortController } from 'node:util';
import { vi } from 'vitest';

// jsdom 的 AbortSignal 与 Node 原生 fetch 不属于同一 realm。
// 保留真实 Node 取消语义，让 Query 的 signal 能被原生 Request 接收。
vi.stubGlobal(
  'AbortController',
  class {
    constructor() {
      return transferableAbortController();
    }
  },
);
