import regexpPlugin from 'eslint-plugin-regexp';
import { GLOB_SRC } from '../globs.ts';
import { asESLintPlugin } from '../plugin-utils.ts';
import type { TypedFlatConfig } from '../types.ts';

/**
 * RegExp quality rules via `eslint-plugin-regexp` (Rslint community plugin).
 */
export const regexp = (): TypedFlatConfig[] => {
  const recommended = regexpPlugin.configs['flat/recommended'];
  return [
    {
      files: [GLOB_SRC],
      name: 'heyq02/regexp',
      plugins: {
        regexp: asESLintPlugin(regexpPlugin),
      },
      rules: recommended.rules,
    },
  ];
};
