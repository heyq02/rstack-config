import { GLOB_JSX, GLOB_SRC, GLOB_SRC_EXT, GLOB_TSX } from '../globs.ts';
import type { TypedFlatConfig } from '../types.ts';

export const specialCases = (): TypedFlatConfig[] => [
  {
    files: ['**/scripts/*', '**/cli.*', '**/bin/**'],
    name: 'heyq02/special/cli',
    rules: {
      'no-console': 'off',
    },
  },
  {
    files: [`**/*.{test,spec}.${GLOB_SRC_EXT}`],
    name: 'heyq02/special/tests',
    rules: {
      'no-unused-expressions': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
    },
  },
  {
    files: [
      `**/*config*.${GLOB_SRC_EXT}`,
      `**/{views,pages,routes,middleware,plugins,api,modules}/${GLOB_SRC}`,
      `**/{index,vite,esbuild,rollup,rolldown,webpack,rspack,farm,unloader,nuxt,rslint}.${GLOB_SRC_EXT}`,
      '**/*.d.ts',
      '**/.prettierrc*',
      '**/.oxfmtrc*',
      '**/oxfmt.config.*',
    ],
    name: 'heyq02/special/allow-default-export',
    rules: {
      'import/no-default-export': 'off',
    },
  },
  {
    files: ['**/ISSUE_TEMPLATE/**'],
    name: 'heyq02/special/github',
    rules: {
      'unicorn/filename-case': 'off',
    },
  },
  {
    files: [GLOB_JSX, GLOB_TSX],
    name: 'heyq02/special/components',
    rules: {
      'unicorn/no-anonymous-default-export': 'off',
      'import/no-default-export': 'off',
    },
  },
];
