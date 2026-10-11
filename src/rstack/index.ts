import type { RstackConfig } from 'rstack';
import type { FmtOptions } from '../fmt/index.ts';
import type { LibOptions } from '../rslib/index.ts';
import type { Options as LintOptions } from '../rslint/types.ts';
import { staged as stagedPreset, type StagedOptions } from '../staged/index.ts';
import { nodeTest, type NodeTestOptions } from '../test/index.ts';

export interface RstackPresetOptions {
  /** Options for `define.lib()` via `@heyq02/rstack-config/rslib`. */
  lib?: LibOptions | false;
  /** Use `nodeLib` instead of `lib`. @default true */
  node?: boolean;
  /** Options for `define.lint()` via `@heyq02/rstack-config/rslint`. */
  lint?: LintOptions | false;
  /** Options for `define.fmt()`. */
  fmt?: FmtOptions | false;
  /** Options for `define.test()`. */
  test?: NodeTestOptions | false;
  /** Options for `define.staged()`. */
  staged?: StagedOptions | false;
}

const DEFAULT_LINT: LintOptions = {
  typescript: true,
  node: 'module',
  react: false,
  jest: false,
  rstest: true,
};

/**
 * Unified Rstack CLI shared config for `define.extends([...])`.
 *
 * Maps the classic sxzz toolchain split onto Rstack's single-config model:
 * - `@sxzz/eslint-config` → `lint` (Rslint)
 * - `@sxzz/prettier-config` → `fmt` (`rs fmt`)
 * - `tsdown-preset-sxzz` → `lib` (Rslib)
 * - plus Rstack-native `test` + `staged`
 *
 * Heavy lint/lib/fmt factories are loaded lazily so `rs lint` / `rs fmt` do
 * not pull each other's dependency graphs. `test` and `staged` are sync
 * (Rstest / staged APIs do not accept async factories).
 *
 * @example
 * ```ts
 * import { define } from 'rstack'
 * import { rstack } from '@heyq02/rstack-config/rstack'
 *
 * define.extends([rstack()])
 * ```
 */
export function rstack({
  lib: libOptions = {},
  node = true,
  lint: lintOptions = DEFAULT_LINT,
  fmt: fmtOptions = {},
  test: testOptions = {},
  staged: stagedOptions = {},
}: RstackPresetOptions = {}): RstackConfig {
  const config: RstackConfig = {};

  if (libOptions !== false) {
    config.lib = async () => {
      const { lib, nodeLib } = await import('../rslib/index.ts');
      return (node ? nodeLib : lib)(libOptions);
    };
  }

  if (lintOptions !== false) {
    config.lint = async () => {
      const { heyq02 } = await import('../rslint/index.ts');
      return heyq02(lintOptions);
    };
  }

  if (fmtOptions !== false) {
    config.fmt = async () => {
      const { fmt } = await import('../fmt/index.ts');
      return fmt(fmtOptions);
    };
  }

  if (testOptions !== false) {
    // Structural TestOptions matches RstestConfig at runtime; cast for dts.
    config.test = nodeTest(testOptions) as RstackConfig['test'];
  }

  if (stagedOptions !== false) {
    config.staged = stagedPreset(stagedOptions);
  }

  return config;
}
