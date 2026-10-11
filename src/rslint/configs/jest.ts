import { jestPlugin } from '@rslint/core';
import { GLOB_TESTS } from '../globs.ts';
import type { TypedFlatConfig } from '../types.ts';

export const jest = (): TypedFlatConfig[] => [
  {
    ...jestPlugin.configs.recommended,
    files: [...GLOB_TESTS],
    name: 'rstack/jest/recommended',
  },
  {
    ...jestPlugin.configs.style,
    files: [...GLOB_TESTS],
    name: 'rstack/jest/style',
  },
];
