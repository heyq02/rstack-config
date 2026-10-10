import { importPlugin } from '@rslint/core';
import { GLOB_SRC } from '../globs.ts';
import type { SortImportsOptions, TypedFlatConfig } from '../types.ts';
import { resolveSortImports } from './sort-imports.ts';

export interface ImportsOptions {
  typescript?: boolean;
  /**
   * Enable Oxfmt-shaped import sorting via `import/order`.
   * @default true
   */
  sortImports?: boolean | SortImportsOptions;
}

export const imports = (options: ImportsOptions = {}): TypedFlatConfig[] => {
  const { typescript = false, sortImports: sortImportsOption = true } = options;

  const configs: TypedFlatConfig[] = [
    {
      ...importPlugin.configs.recommended,
      files: [GLOB_SRC],
      name: 'heyq02/imports/recommended',
    },
    {
      files: [GLOB_SRC],
      name: 'heyq02/imports',
      rules: {
        'import/first': 'error',
        'import/no-default-export': 'error',
        'import/no-duplicates': ['error', { 'prefer-inline': true }],
        'import/no-mutable-exports': 'error',
        'import/no-named-default': 'error',
        // TypeScript / bundler resolution covers these more reliably
        ...(typescript
          ? {
              'import/default': 'off',
              'import/named': 'off',
              'import/namespace': 'off',
              'import/no-unresolved': 'off',
            }
          : {}),
      },
    },
  ];

  if (sortImportsOption) {
    const { rule, settings } = resolveSortImports(sortImportsOption);
    configs.push({
      files: [GLOB_SRC],
      name: 'heyq02/imports/sort',
      ...(Object.keys(settings).length > 0 ? { settings } : {}),
      rules: {
        'import/order': ['error', rule],
      },
    });
  }

  return configs;
};
