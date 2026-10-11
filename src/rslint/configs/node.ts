import { nodePlugin } from '@rslint/core';
import { GLOB_SRC } from '../globs.ts';
import type { NodePreset, TypedFlatConfig } from '../types.ts';

export const node = (
  preset: Exclude<NodePreset, false> = 'module',
): TypedFlatConfig[] => {
  if (preset === 'mixed') {
    return nodePlugin.configs.recommended.map((entry, index) => ({
      ...entry,
      name: entry.name ?? `rstack/node/recommended-${index}`,
    }));
  }

  if (preset === 'script') {
    return [
      {
        ...nodePlugin.configs.recommendedScript,
        files: [GLOB_SRC],
        name: 'rstack/node/recommended-script',
      },
    ];
  }

  // Default: ESM-oriented Node rules + a few curated extras from sxzz-style
  return [
    {
      ...nodePlugin.configs.recommendedModule,
      files: [GLOB_SRC],
      name: 'rstack/node/recommended-module',
    },
    {
      files: [GLOB_SRC],
      name: 'rstack/node',
      plugins: ['node'],
      rules: {
        'node/handle-callback-err': ['error', '^(err|error)$'],
        'node/no-deprecated-api': 'error',
        'node/no-exports-assign': 'error',
        'node/no-new-require': 'error',
        'node/no-path-concat': 'error',
        'node/prefer-global/buffer': ['error', 'never'],
        'node/prefer-global/process': ['error', 'never'],
        'node/process-exit-as-throw': 'error',
      },
    },
  ];
};
