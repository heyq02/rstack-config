import { globalIgnores } from '@rslint/core';
import { GLOB_EXCLUDE } from '../globs.ts';
import type { TypedFlatConfig } from '../types.ts';

export const ignores = (extra: string[] = []): TypedFlatConfig[] => [
  {
    ...globalIgnores([...GLOB_EXCLUDE, ...extra]),
    name: 'heyq02/global-ignores',
  },
];
