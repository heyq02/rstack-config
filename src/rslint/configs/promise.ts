import { promisePlugin } from '@rslint/core';
import { GLOB_SRC } from '../globs.ts';
import type { TypedFlatConfig } from '../types.ts';

export const promise = (): TypedFlatConfig[] => [
  {
    ...promisePlugin.configs.recommended,
    files: [GLOB_SRC],
    name: 'heyq02/promise/recommended',
  },
  {
    files: [GLOB_SRC],
    name: 'heyq02/promise',
    rules: {
      // Modern async/await code rarely benefits from these
      'promise/always-return': 'off',
      'promise/catch-or-return': 'off',
      'promise/no-nesting': 'off',
    },
  },
];
