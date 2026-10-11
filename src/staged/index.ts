/**
 * lint-staged style config for `define.staged()` / `rs staged`.
 */
export type StagedConfig =
  | Record<string, string | string[]>
  | ((stagedFileNames: readonly string[]) => string | string[]);

export interface StagedOptions {
  /**
   * Also format every staged file (including non-JS).
   * @default true
   */
  formatAll?: boolean;
  /**
   * Lint-fix JS/TS before commit.
   * @default true
   */
  lintFix?: boolean;
}

/**
 * Opinionated staged-file tasks for Rstack CLI hooks.
 */
export function staged({
  formatAll = true,
  lintFix = true,
}: StagedOptions = {}): StagedConfig {
  const config: Record<string, string | string[]> = {};

  if (formatAll) {
    config['*'] = 'rs fmt --no-error-on-unmatched-pattern --ignore-unknown';
  }

  if (lintFix) {
    config['*.{js,jsx,ts,tsx,mjs,cjs,mts,cts}'] = 'rs lint --fix';
  }

  return config;
}
