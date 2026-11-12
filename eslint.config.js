import { readdirSync } from 'node:fs';
import { URL } from 'node:url';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import hooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-config-prettier';

const featureNames = readdirSync(new URL('./src/features', import.meta.url), {
  withFileTypes: true,
})
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

const compositionImports = [
  '**/app/**',
  '**/routes/**',
  '**/routes',
  '**/mocks/**',
  '**/mocks',
  '**/main',
  '**/main.tsx',
  '**/routeTree.gen',
  '**/routeTree.gen.ts',
];

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function createFeatureBoundaryConfig(feature) {
  const privateFeatureImports = featureNames
    .filter((name) => name !== feature)
    .map((name) => ({
      regex: String.raw`(?:^|/)(?:features/)?${escapeRegExp(name)}/(?!index(?:\.tsx?)?$)`,
      message: '跨业务模块只通过公开 index.ts 导入。',
    }));

  return {
    files: [`src/features/${feature}/**/*.{ts,tsx}`],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: compositionImports,
              message: '业务模块不依赖应用入口、路由或 Mock。',
            },
            ...privateFeatureImports,
          ],
        },
      ],
    },
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
    files: ['src/shared/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: ['**/features/**', '**/features', ...compositionImports],
        },
      ],
    },
  },
  ...featureNames.map(createFeatureBoundaryConfig),
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
