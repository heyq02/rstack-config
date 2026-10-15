import type { RstackConfig } from 'rstack';
import type { AppOptions, AppParams } from '../app/index.ts';
import type { FmtOptions } from '../fmt/index.ts';
import type { LibOptions } from '../rslib/index.ts';
import type {
  Options as LintOptions,
  TypedFlatConfig,
} from '../rslint/types.ts';
import { staged as stagedPreset, type StagedOptions } from '../staged/index.ts';
import { test as testPreset, type TestPresetOptions } from '../test/index.ts';

export type { AppOptions } from '../app/index.ts';

export interface RstackPresetOptions {
  /**
   * Options for `define.app()` (Rsbuild: `rs dev`, `rs build`, `rs preview`).
   * When set, `lib` defaults to `false`.
   */
  app?: AppOptions | false;
  /** Options for `define.lib()` via `@heyq02/rstack-config/rslib`. */
  lib?: LibOptions | false;
  /** Use `nodeLib` instead of `lib`. @default true */
  node?: boolean;
  /** Options for `define.lint()` via `@heyq02/rstack-config/rslint`. */
  lint?: LintOptions | false;
  /** Options for `define.fmt()`. */
  fmt?: FmtOptions | false;
  /** Options for `define.test()`. */
  test?: TestPresetOptions | false;
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
 * Rsbuild resolves extensionless imports (`./mount` → `./mount.tsx`).
 * `node/no-missing-import` uses Node's resolver and reports those files.
 */
const APP_EXTENSIONLESS_IMPORTS: TypedFlatConfig = {
  name: 'rstack/app/extensionless-imports',
  rules: {
    'node/no-missing-import': 'off',
  },
};

function resolveLibOptions(
  app: AppOptions | false | undefined,
  lib: LibOptions | false | undefined,
): LibOptions | false {
  if (lib !== undefined) {
    return lib;
  }

  if (app !== undefined && app !== false) {
    return false;
  }

  return {};
}

/**
 * Unified Rstack CLI shared config for `define.extends([...])`.
 *
 * Maps the classic sxzz toolchain split onto Rstack's single-config model:
 * - `@sxzz/eslint-config` → `lint` (Rslint)
 * - `@sxzz/prettier-config` → `fmt` (`rs fmt`)
 * - `tsdown-preset-sxzz` → `lib` (Rslib)
 * - Rsbuild sites → `app` (`define.app()`)
 * - plus Rstack-native `test` + `staged`
 *
 * Heavy lint/lib/app/fmt factories are loaded lazily so `rs lint` / `rs fmt`
 * do not pull each other's dependency graphs. `test` and `staged` are sync
 * (Rstest / staged APIs do not accept async factories).
 *
 * `lib` and `app` are mutually exclusive in the defaults: setting `app`
 * leaves the library build off unless `lib` is passed. Existing library
 * callers keep `nodeLib()`.
 *
 * @example
 * ```ts
 * import { define } from 'rstack'
 * import { rstack } from '@heyq02/rstack-config/rstack'
 *
 * define.extends([rstack()])
 * ```
 *
 * @example
 * ```ts
 * define.extends([
 *   rstack({
 *     app: {
 *       source: { entry: { index: './src/index.tsx' } },
 *     },
 *     lint: { react: true },
 *   }),
 * ])
 * ```
 */
export function rstack({
  app: appOptions,
  lib: libOptions,
  node = true,
  lint: lintOptions = DEFAULT_LINT,
  fmt: fmtOptions = {},
  test: testOptions = {},
  staged: stagedOptions = {},
}: RstackPresetOptions = {}): RstackConfig {
  const config: RstackConfig = {};
  const resolvedLib = resolveLibOptions(appOptions, libOptions);
  const hasApp = appOptions !== undefined && appOptions !== false;

  if (hasApp) {
    const options = appOptions;
    config.app = async (params: AppParams) => {
      const { app } = await import('../app/index.ts');
      return app(options, params);
    };
  }

  if (resolvedLib !== false) {
    config.lib = async () => {
      const { lib, nodeLib } = await import('../rslib/index.ts');
      return (node ? nodeLib : lib)(resolvedLib);
    };
  }

  if (lintOptions !== false) {
    config.lint = async () => {
      const { lint } = await import('../rslint/index.ts');
      // Node rules stay available for config files. Only the resolver rule
      // that rejects Rsbuild's extensionless imports is turned off.
      if (hasApp && lintOptions.node !== false) {
        return lint(lintOptions, APP_EXTENSIONLESS_IMPORTS);
      }
      return lint(lintOptions);
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
    config.test = testPreset(testOptions) as RstackConfig['test'];
  }

  if (stagedOptions !== false) {
    config.staged = stagedPreset(stagedOptions);
  }

  return config;
}
