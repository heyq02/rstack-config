import deMorganPlugin from 'eslint-plugin-de-morgan';
import { GLOB_SRC } from '../globs.ts';
import { asESLintPlugin } from '../plugin-utils.ts';
import type { TypedFlatConfig } from '../types.ts';

/**
 * De Morgan rewrites via `eslint-plugin-de-morgan` (Rslint community plugin).
 */
export const deMorgan = (): TypedFlatConfig[] => [
  {
    files: [GLOB_SRC],
    name: 'rstack/de-morgan',
    plugins: {
      'de-morgan': asESLintPlugin(deMorganPlugin),
    },
    rules: {
      'de-morgan/no-negated-conjunction': 'error',
      'de-morgan/no-negated-disjunction': 'error',
    },
  },
];
