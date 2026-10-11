import { unicornPlugin } from '@rslint/core';
import { GLOB_SRC } from '../globs.ts';
import type { TypedFlatConfig } from '../types.ts';

export const unicorn = (): TypedFlatConfig[] => [
  {
    ...unicornPlugin.configs.recommended,
    files: [GLOB_SRC],
    name: 'rstack/unicorn/recommended',
  },
  {
    files: [GLOB_SRC],
    name: 'rstack/unicorn',
    rules: {
      'unicorn/filename-case': [
        'error',
        {
          cases: { kebabCase: true, pascalCase: true },
          ignore: [
            String.raw`^[A-Z]+\..*$`,
            String.raw`^[a-z]{2}-[A-Z]{2}$`, // zh-CN, en-US, etc.
            String.raw`import_map\.json`,
          ],
        },
      ],
      // Too opinionated for shared library / app code
      'unicorn/no-null': 'off',
      'unicorn/no-this-assignment': 'off',
      'unicorn/prefer-ternary': 'off',
      // Prefer explicit process.exit handling in CLIs
      'unicorn/no-process-exit': 'off',
    },
  },
];
