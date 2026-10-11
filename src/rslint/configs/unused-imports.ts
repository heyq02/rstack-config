import unusedImportsPlugin from 'eslint-plugin-unused-imports';
import { GLOB_SRC } from '../globs.ts';
import { asESLintPlugin } from '../plugin-utils.ts';
import type { TypedFlatConfig } from '../types.ts';

const unusedVarsOptions = {
  args: 'after-used',
  argsIgnorePattern: '^_',
  ignoreRestSiblings: true,
  varsIgnorePattern: '^_',
} as const;

export interface UnusedImportsOptions {
  /**
   * When true, unused-import rules are disabled so the editor stays quiet while typing.
   * @default false
   */
  isInEditor?: boolean;
}

/**
 * Autofix unused imports via `eslint-plugin-unused-imports` (Rslint community plugin).
 */
export const unusedImports = (
  options: UnusedImportsOptions = {},
): TypedFlatConfig[] => {
  const { isInEditor = false } = options;

  return [
    {
      files: [GLOB_SRC],
      name: 'rstack/unused-imports',
      plugins: {
        'unused-imports': asESLintPlugin(unusedImportsPlugin),
      },
      rules: {
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        'unused-imports/no-unused-imports': isInEditor ? 'off' : 'error',
        'unused-imports/no-unused-vars': isInEditor
          ? 'off'
          : ['error', { ...unusedVarsOptions }],
      },
    },
  ];
};
