import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import hooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-config-prettier';

const legacyImports = [
  {
    group: ['**/features/**', '**/features', '@/features/**', '@/features'],
    message:
      '项目已取消 features 目录，请使用 pages / components / api / hooks / lib。',
  },
  {
    group: ['**/shared/**', '**/shared', '@/shared/**', '@/shared'],
    message: '项目已取消 shared 目录，请使用 components / api / hooks / lib。',
  },
];

const boundary = (group, message) => ({ group, message });

const pageImports = ['@/pages', '@/pages/**', '**/pages', '**/pages/**'];
const componentImports = [
  '@/components',
  '@/components/**',
  '**/components',
  '**/components/**',
];
const apiImports = ['@/api', '@/api/**', '**/api', '**/api/**'];
const hookImports = ['@/hooks', '@/hooks/**', '**/hooks', '**/hooks/**'];
const mockImports = ['@/mocks', '@/mocks/**', '**/mocks', '**/mocks/**'];

function restrictedImports(patterns) {
  return {
    'no-restricted-imports': [
      'error',
      { patterns: [...legacyImports, ...patterns] },
    ],
  };
}

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      '.agents/skills/**',
      '.claude/skills/**',
      'coverage/**',
      'public/mockServiceWorker.js',
      'playwright-report/**',
      'test-results/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked.map((config) => ({
    ...config,
    files: ['**/*.{ts,tsx}'],
  })),
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: { 'react-hooks': hooks },
    rules: {
      ...hooks.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': [
        'error',
        { checksVoidReturn: { attributes: false } },
      ],
    },
  },
  {
    files: ['src/api/**/*.{ts,tsx}'],
    rules: restrictedImports([
      boundary(pageImports, 'API 层不依赖页面。'),
      boundary(componentImports, 'API 层不依赖组件。'),
      boundary(mockImports, 'API 层不依赖 Mock。'),
      boundary(
        hookImports,
        '依赖方向应为 hooks → api，API 层不反向依赖 hooks。',
      ),
    ]),
  },
  {
    files: ['src/components/**/*.{ts,tsx}'],
    rules: restrictedImports([
      boundary(pageImports, '跨页面组件不依赖具体页面。'),
      boundary(mockImports, '跨页面组件不依赖 Mock。'),
    ]),
  },
  {
    files: ['src/hooks/**/*.{ts,tsx}'],
    rules: restrictedImports([
      boundary(pageImports, '通用 hooks 不依赖页面。'),
      boundary(componentImports, '通用 hooks 不依赖组件。'),
      boundary(mockImports, '通用 hooks 不依赖 Mock。'),
    ]),
  },
  {
    files: ['src/lib/**/*.{ts,tsx}'],
    rules: restrictedImports([
      boundary(pageImports, '通用工具不依赖页面。'),
      boundary(componentImports, '通用工具不依赖组件。'),
      boundary(apiImports, '通用工具不依赖 API 层。'),
      boundary(hookImports, '通用工具不依赖 hooks。'),
      boundary(mockImports, '通用工具不依赖 Mock。'),
    ]),
  },
  {
    files: ['src/mocks/**/*.{ts,tsx}'],
    rules: restrictedImports([]),
  },
  {
    files: ['src/pages/**/*.{ts,tsx}'],
    rules: restrictedImports([]),
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/api/client.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector:
            'CallExpression[callee.type="Identifier"][callee.name="fetch"]',
          message: 'HTTP 请求统一使用 api/client.ts。',
        },
        {
          selector:
            'CallExpression[callee.type="MemberExpression"][callee.property.name="fetch"][callee.object.name=/^(window|globalThis)$/]',
          message: 'HTTP 请求统一使用 api/client.ts。',
        },
      ],
    },
  },
  prettier,
);
