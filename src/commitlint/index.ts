import conventional from '@commitlint/config-conventional';

/**
 * Allowed Conventional Commit types (aligned with changelogithub / sxzz).
 */
export const COMMIT_TYPES = [
  'feat',
  'fix',
  'docs',
  'style',
  'refactor',
  'perf',
  'test',
  'build',
  'ci',
  'chore',
  'revert',
] as const;

export type CommitType = (typeof COMMIT_TYPES)[number];

/** Minimal commitlint rule tuple (mutable or readonly from shareable configs). */
export type CommitlintRuleConfig =
  | readonly [level: number]
  | readonly [level: number, applicable: 'always' | 'never']
  | readonly [level: number, applicable: 'always' | 'never', value: unknown];

/**
 * Shareable commitlint config shape (subset of `@commitlint/types` UserConfig).
 */
export interface CommitlintConfig {
  parserPreset?: unknown;
  extends?: string | string[];
  rules?: Record<string, CommitlintRuleConfig | undefined>;
  [key: string]: unknown;
}

export interface CommitlintOptions {
  /**
   * Max commit header length (title line).
   * Keep short enough for GitHub Release lists (changelogithub).
   * @default 100
   */
  headerMaxLength?: number;
  /**
   * Allowed `type` values for `type-enum`.
   * @default COMMIT_TYPES
   */
  types?: readonly string[];
  /**
   * Extra / overriding rules merged on top of the preset.
   */
  rules?: CommitlintConfig['rules'];
}

/**
 * Opinionated Conventional Commits preset for `@commitlint/cli`.
 *
 * Rstack CLI has no `define.commitlint()`, so wire this from
 * `commitlint.config.js` (one-liner re-export or `commitlint({ ... })`).
 *
 * Merges `@commitlint/config-conventional` into a flat config (no `extends`)
 * so consumers only need `@commitlint/cli` + this package under pnpm.
 *
 * @example
 * ```js
 * // commitlint.config.js — defaults
 * export { default } from '@heyq02/rstack-config/commitlint'
 * ```
 *
 * @example
 * ```js
 * // commitlint.config.js — options
 * import { commitlint } from '@heyq02/rstack-config/commitlint'
 * export default commitlint({ headerMaxLength: 72 })
 * ```
 */
export function commitlint({
  headerMaxLength = 100,
  types = COMMIT_TYPES,
  rules,
}: CommitlintOptions = {}): CommitlintConfig {
  const base = conventional as unknown as CommitlintConfig;

  return {
    ...base,
    rules: {
      ...base.rules,
      'header-max-length': [2, 'always', headerMaxLength],
      'type-enum': [2, 'always', [...types]],
      ...rules,
    },
  };
}

export default commitlint();
