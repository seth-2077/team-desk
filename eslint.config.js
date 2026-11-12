import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import hooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      '.agents/skills/shadcn/**',
      '.agents/skills/vercel-react-best-practices/**',
      '.agents/skills/router-core/**',
      '.agents/skills/react-router/**',
      '.agents/skills/router-query/**',
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
    files: ['src/shared/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            '**/features/**',
            '**/features',
            '**/app/**',
            '**/mocks/**',
          ],
        },
      ],
    },
  },
  ...['members', 'tickets'].map((feature) => ({
    files: [`src/features/${feature}/**/*.{ts,tsx}`],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/app/**', '**/mocks/**'],
              message: '业务模块不依赖 app 或 mocks。',
            },
            {
              regex: `(?:^|/)(?:features/)?${feature === 'members' ? 'tickets' : 'members'}/(?!index(?:\\.tsx?)?$)`,
              message: '跨业务模块只通过公开 index.ts 导入。',
            },
          ],
        },
      ],
    },
  })),
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/shared/api.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector:
            'CallExpression[callee.type="Identifier"][callee.name="fetch"]',
          message: 'HTTP 请求统一使用 shared/api.ts。',
        },
        {
          selector:
            'CallExpression[callee.type="MemberExpression"][callee.property.name="fetch"][callee.object.name=/^(window|globalThis)$/]',
          message: 'HTTP 请求统一使用 shared/api.ts。',
        },
      ],
    },
  },
  prettier,
);
