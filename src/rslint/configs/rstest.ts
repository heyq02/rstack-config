import { rstestPlugin } from '@rslint/core';
import { GLOB_TESTS } from '../globs.ts';
import type { TypedFlatConfig } from '../types.ts';

export const rstest = (): TypedFlatConfig[] => [
  {
    ...rstestPlugin.configs.recommended,
    files: [...GLOB_TESTS],
    name: 'rstack/rstest/recommended',
  },
];
