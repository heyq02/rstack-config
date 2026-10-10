import { globals, js } from '@rslint/core';
import { GLOB_SRC } from '../globs.ts';
import type { TypedFlatConfig } from '../types.ts';

export const restrictedSyntaxJs: string[] = [
  'ForInStatement',
  'LabeledStatement',
];

export const javascript = (): TypedFlatConfig[] => [
  {
    ...js.configs.recommended,
    name: 'heyq02/js/recommended',
  },
  {
    files: [GLOB_SRC],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: {
        ...globals.browser,
        ...globals.es2026,
        ...globals.nodeBuiltin,
      },
      sourceType: 'module',
    },
    name: 'heyq02/js',
    rules: {
      'array-callback-return': 'error',
      'block-scoped-var': 'error',
      'dot-notation': 'warn',
      eqeqeq: ['error', 'smart'],
      'no-alert': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error', 'info', 'clear'] }],
      'no-debugger': 'warn',
      'no-duplicate-imports': 'error',
      'no-empty': ['error', { allowEmptyCatch: true }],
      'no-fallthrough': [
        'warn',
        { commentPattern: String.raw`break[\s\w]*omitted` },
      ],
      'no-inner-declarations': 'error',
      'no-lonely-if': 'error',
      'no-multi-str': 'error',
      'no-restricted-syntax': ['error', ...restrictedSyntaxJs],
      'no-unused-expressions': [
        'error',
        {
          allowShortCircuit: true,
          allowTaggedTemplates: true,
          allowTernary: true,
        },
      ],
      'no-unused-vars': [
        'error',
        {
          args: 'after-used',
          argsIgnorePattern: '^_',
          ignoreRestSiblings: true,
          varsIgnorePattern: '^_',
        },
      ],
      'no-useless-call': 'error',
      'no-useless-computed-key': 'error',
      'no-useless-constructor': 'error',
      'no-useless-rename': 'error',
      'no-var': 'error',
      'no-void': 'error',
      'object-shorthand': [
        'error',
        'always',
        { avoidQuotes: true, ignoreConstructors: false },
      ],
      'one-var': ['error', { initialized: 'never' }],
      'prefer-arrow-callback': [
        'error',
        { allowNamedFunctions: false, allowUnboundThis: true },
      ],
      'prefer-const': [
        'warn',
        { destructuring: 'all', ignoreReadBeforeAssign: true },
      ],
      'prefer-exponentiation-operator': 'error',
      'prefer-regex-literals': ['error', { disallowRedundantWrapping: true }],
      'prefer-rest-params': 'error',
      'prefer-spread': 'error',
      'prefer-template': 'error',
      'require-await': 'error',
      'unicode-bom': ['error', 'never'],
      'use-isnan': [
        'error',
        { enforceForIndexOf: true, enforceForSwitchCase: true },
      ],
      'valid-typeof': ['error', { requireStringLiterals: true }],
      'vars-on-top': 'error',
    },
  },
];
