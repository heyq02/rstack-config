import type { ESLintPlugin } from '@rslint/core';

/** Cast community ESLint plugin objects into Rslint's `ESLintPlugin` shape. */
export function asESLintPlugin(plugin: unknown): ESLintPlugin {
  return plugin as ESLintPlugin;
}
