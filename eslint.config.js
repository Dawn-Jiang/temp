import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'node_modules']),

  // 构建脚本与配置文件（Node 环境）
  {
    files: ['vite.config.ts', 'eslint.config.js'],
    extends: [tseslint.configs.recommended],
    languageOptions: {
      globals: globals.node,
    },
  },

  // 应用源代码
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      globals: globals.browser,
    },
    settings: {
      react: {
        version: '19',
      },
    },
    rules: {
      // 基础 JS 规则
      'no-console': ['warn', { allow: ['error', 'warn'] }],
      'no-debugger': 'warn',
      'no-var': 'error',
      'prefer-const': 'error',
      'eqeqeq': ['error', 'always', { null: 'ignore' }],
      'no-empty': ['error', { allowEmptyCatch: true }],
      'no-unused-vars': 'off',

      // TypeScript 规则
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/consistent-type-imports': ['warn', { prefer: 'type-imports' }],
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/consistent-type-assertions': 'warn',

      // React Hooks 规则（显式覆盖）
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      // 数据加载场景常见模式，将其降为警告以避免阻塞构建
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
])
