import { jestPlugin } from '@rslint/core';
import { GLOB_TESTS } from '../globs.ts';
import type { TypedFlatConfig } from '../types.ts';

export const jest = (): TypedFlatConfig[] => [
  {
    ...jestPlugin.configs.recommended,
    files: [...GLOB_TESTS],
    name: 'heyq02/jest/recommended',
  },
  {
    ...jestPlugin.configs.style,
    files: [...GLOB_TESTS],
    name: 'heyq02/jest/style',
  },
];
