import { jsxA11yPlugin, reactHooksPlugin, reactPlugin } from '@rslint/core';
import { GLOB_JSX, GLOB_TSX } from '../globs.ts';
import type { TypedFlatConfig } from '../types.ts';

const reactFiles = [GLOB_JSX, GLOB_TSX, '**/*.{jsx,tsx}'];

export const jsxA11y = (): TypedFlatConfig[] => [
  {
    ...jsxA11yPlugin.configs.recommended,
    files: reactFiles,
    name: 'rstack/jsx-a11y/recommended',
  },
];

export const react = (
  options: { jsxA11y?: boolean } = {},
): TypedFlatConfig[] => {
  const configs: TypedFlatConfig[] = [
    {
      ...reactPlugin.configs.recommended,
      files: reactFiles,
      name: 'rstack/react/recommended',
    },
    {
      ...reactHooksPlugin.configs.recommended,
      files: reactFiles,
      name: 'rstack/react-hooks/recommended',
    },
  ];

  if (options.jsxA11y !== false) {
    configs.push(...jsxA11y());
  }

  return configs;
};
