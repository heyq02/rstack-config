import eslintCommentsPlugin from '@eslint-community/eslint-plugin-eslint-comments';
import { GLOB_SRC } from '../globs.ts';
import { asESLintPlugin } from '../plugin-utils.ts';
import type { TypedFlatConfig } from '../types.ts';

/**
 * `eslint-disable` hygiene via `@eslint-community/eslint-plugin-eslint-comments`.
 */
export const eslintComments = (): TypedFlatConfig[] => [
  {
    files: [GLOB_SRC],
    name: 'heyq02/eslint-comments',
    plugins: {
      '@eslint-community/eslint-comments': asESLintPlugin(eslintCommentsPlugin),
    },
    rules: {
      '@eslint-community/eslint-comments/disable-enable-pair': [
        'error',
        { allowWholeFile: true },
      ],
      '@eslint-community/eslint-comments/no-aggregating-enable': 'error',
      '@eslint-community/eslint-comments/no-duplicate-disable': 'error',
      '@eslint-community/eslint-comments/no-unlimited-disable': 'error',
      '@eslint-community/eslint-comments/no-unused-enable': 'error',
    },
  },
];
