import { createRequire } from 'node:module';
import { mergeRslibConfig, type RslibConfig } from '@rslib/core';
import {
  pluginAreTheTypesWrong,
  type PluginAreTheTypesWrongOptions,
} from 'rsbuild-plugin-arethetypeswrong';
import {
  pluginPublint,
  type PluginPublintOptions,
} from 'rsbuild-plugin-publint';

export type { PluginAreTheTypesWrongOptions } from 'rsbuild-plugin-arethetypeswrong';
export type { PluginPublintOptions } from 'rsbuild-plugin-publint';

type Entry = NonNullable<NonNullable<RslibConfig['source']>['entry']>;

/**
 * Convenience wrapper around
 * [`rsbuild-plugin-arethetypeswrong`](https://github.com/rstackjs/rsbuild-plugin-arethetypeswrong).
 * - omit / `true`: enabled with ESM-only defaults (`ignoreResolutions: node10, node16-cjs`)
 * - `false`: disabled
 * - `'ci-only'`: only enabled when `process.env.CI` is set
 * - object: passed to `pluginAreTheTypesWrong()`, with ESM-only `ignoreResolutions` as default
 */
export type AttwConfig = boolean | 'ci-only' | PluginAreTheTypesWrongOptions;

/**
 * Options forwarded to [`RsdoctorRspackPlugin`](https://rsdoctor.rs/config/options/options).
 * Registered on Rslib `tools.rspack.plugins` — there is no separate Rsdoctor config export.
 */
export interface RsdoctorPluginOptions {
  /** Skip the local report server. Set automatically when `CI` is set. */
  disableClientServer?: boolean;
  port?: number;
  output?: {
    mode?: 'brief' | 'normal';
    /**
     * Directory for the post-build report.
     * Local default `.rsdoctor`. CI default `dist/.rsdoctor`.
     */
    reportDir?: string;
    reportCodeType?: 'noModuleSource' | 'noAssetsAndModuleSource' | 'noCode';
    options?: {
      type?: ('html' | 'json')[];
      htmlOptions?: {
        reportHtmlName?: string;
        writeDataJson?: boolean;
      };
      jsonOptions?: {
        fileName?: string;
      };
    };
  };
  /** Other `@rsdoctor/rspack-plugin` options (`features`, `linter`, …). */
  [key: string]: unknown;
}

/**
 * How `lib()` / `nodeLib()` register `@rsdoctor/rspack-plugin`.
 * - omit / `false`: not registered
 * - `true`: registered when `RSDOCTOR=true`
 * - `'ci-only'`: registered when `CI` is set
 * - object: plugin options, registered when `RSDOCTOR=true`
 *
 * When `CI` is set, the plugin writes brief JSON to
 * `dist/.rsdoctor/rsdoctor-data.json` for
 * [rsdoctor-action](https://github.com/web-infra-dev/rsdoctor-action)
 * and does not start the client server.
 */
export type RsdoctorConfig = boolean | 'ci-only' | RsdoctorPluginOptions;

const RSDOCTOR_PACKAGE = '@rsdoctor/rspack-plugin';

export interface RsdoctorRspackPluginInstance {
  readonly name: string;
  readonly isRsdoctorPlugin: boolean;
  options: RsdoctorPluginOptions;
  apply: (compiler: unknown) => unknown;
}

type LoadRsdoctor = () => {
  RsdoctorRspackPlugin: new (
    options?: RsdoctorPluginOptions,
  ) => RsdoctorRspackPluginInstance;
};

export interface LibOptions {
  /**
   * Build entry strategy.
   * - `'index'`: `src/index.ts` (bundle)
   * - `'shallow'`: `src/*` (bundleless)
   * - `'all'`: `src/**` (bundleless)
   * - custom: pass through to `source.entry`
   */
  entry?: 'index' | 'shallow' | 'all' | Entry;
  /**
   * Dependencies that should be bundled instead of externalized.
   * Mapped to `output.autoExternal.exclude`.
   */
  inlineDeps?: (string | RegExp)[];
  /**
   * Built-in [`rsbuild-plugin-publint`](https://github.com/rstackjs/rsbuild-plugin-publint).
   * - omit / `true`: enabled with defaults
   * - `false`: disabled
   * - object: passed to `pluginPublint()`
   */
  publint?: boolean | PluginPublintOptions;
  /**
   * Built-in [`rsbuild-plugin-arethetypeswrong`](https://github.com/rstackjs/rsbuild-plugin-arethetypeswrong).
   * - omit / `true`: enabled with ESM-only defaults
   * - `false`: disabled
   * - `'ci-only'`: only enabled when `process.env.CI` is set
   * - object: passed to `pluginAreTheTypesWrong()`
   */
  attw?: AttwConfig;
  /**
   * [Rsdoctor](https://rsdoctor.rs/) on `tools.rspack` via `@rsdoctor/rspack-plugin`.
   * - omit / `false`: not registered
   * - `true`: registered when `RSDOCTOR=true`; CI writes `dist/.rsdoctor/rsdoctor-data.json`
   * - `'ci-only'`: same report when `CI` is set
   * - object: plugin options, registered when `RSDOCTOR=true`
   */
  rsdoctor?: RsdoctorConfig;
}

/** Default ignoreResolutions for pure ESM libraries (attw profile ≈ esm-only). */
export const ESM_ONLY_IGNORE_RESOLUTIONS = [
  'node10',
  'node16-cjs',
] as const satisfies NonNullable<
  NonNullable<
    PluginAreTheTypesWrongOptions['areTheTypesWrongOptions']
  >['ignoreResolutions']
>;

function resolveEntry(entry: LibOptions['entry'] = 'index'): {
  entry: Entry;
  bundle: boolean;
} {
  if (entry === 'index') {
    return {
      entry: { index: 'src/index.ts' },
      bundle: true,
    };
  }

  if (entry === 'shallow') {
    return {
      entry: { index: 'src/*' },
      bundle: false,
    };
  }

  if (entry === 'all') {
    return {
      entry: { index: 'src/**' },
      bundle: false,
    };
  }

  return {
    entry,
    bundle: true,
  };
}

/** Resolve attw convenience values into official plugin options. Exported for tests. */
export function resolveAttwOptions(
  attw: AttwConfig = true,
): PluginAreTheTypesWrongOptions | false {
  if (attw === false) {
    return false;
  }

  const esmOnly = {
    ignoreResolutions: [...ESM_ONLY_IGNORE_RESOLUTIONS],
  };

  if (attw === true) {
    return { areTheTypesWrongOptions: esmOnly };
  }

  if (attw === 'ci-only') {
    if (!process.env.CI) {
      return false;
    }
    return { areTheTypesWrongOptions: esmOnly };
  }

  return {
    ...attw,
    areTheTypesWrongOptions: {
      ...esmOnly,
      ...attw.areTheTypesWrongOptions,
    },
  };
}

function isModuleNotFound(error: unknown): boolean {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return false;
  }

  const code = (error as { code?: string }).code;
  return code === 'MODULE_NOT_FOUND' || code === 'ERR_MODULE_NOT_FOUND';
}

function rsdoctorEnvEnabled(): boolean {
  return process.env.RSDOCTOR === 'true';
}

function shouldEnableRsdoctor(
  rsdoctor: RsdoctorConfig,
): rsdoctor is Exclude<RsdoctorConfig, false> {
  if (rsdoctor === false) {
    return false;
  }

  if (rsdoctor === 'ci-only') {
    return Boolean(process.env.CI);
  }

  return rsdoctorEnvEnabled();
}

/**
 * Brief JSON for `web-infra-dev/rsdoctor-action`.
 * Brief mode writes into `reportDir` itself, so this must be `dist/.rsdoctor`
 * to match `file_path: dist/.rsdoctor/rsdoctor-data.json`.
 */
function ciReportOptions(): ResolvedRsdoctorOptions {
  return {
    disableClientServer: true,
    output: {
      mode: 'brief',
      reportDir: 'dist/.rsdoctor',
      options: {
        type: ['json'],
        jsonOptions: {
          fileName: 'rsdoctor-data.json',
        },
      },
    },
  };
}

function localReportOptions(): ResolvedRsdoctorOptions {
  return {
    output: {
      reportDir: '.rsdoctor',
    },
  };
}

interface ResolvedRsdoctorOptions extends RsdoctorPluginOptions {
  output: NonNullable<RsdoctorPluginOptions['output']>;
}

function mergeOutputOptions(
  baseOutput: ResolvedRsdoctorOptions['output'],
  customOptions: NonNullable<ResolvedRsdoctorOptions['output']['options']>,
): NonNullable<ResolvedRsdoctorOptions['output']['options']> {
  const baseOptions = baseOutput.options;

  return {
    ...baseOptions,
    ...customOptions,
    htmlOptions: {
      ...(baseOptions ? baseOptions.htmlOptions : {}),
      ...(customOptions.htmlOptions ? customOptions.htmlOptions : {}),
    },
    jsonOptions: {
      ...(baseOptions ? baseOptions.jsonOptions : {}),
      ...(customOptions.jsonOptions ? customOptions.jsonOptions : {}),
    },
  };
}

function mergeRsdoctorOptions(
  base: ResolvedRsdoctorOptions,
  custom: RsdoctorPluginOptions,
): ResolvedRsdoctorOptions {
  if (!custom.output) {
    return {
      ...base,
      ...custom,
      output: base.output,
    };
  }

  const mode =
    custom.output.mode ??
    base.output.mode ??
    (custom.output.options ? 'brief' : 'normal');

  return {
    ...base,
    ...custom,
    output: {
      ...base.output,
      ...custom.output,
      mode,
      options: custom.output.options
        ? mergeOutputOptions(base.output, custom.output.options)
        : base.output.options,
    },
  };
}

function resolveRsdoctorPluginOptions(
  rsdoctor: Exclude<RsdoctorConfig, false>,
): ResolvedRsdoctorOptions {
  const defaults = process.env.CI ? ciReportOptions() : localReportOptions();

  if (rsdoctor === true || rsdoctor === 'ci-only') {
    return defaults;
  }

  return mergeRsdoctorOptions(defaults, rsdoctor);
}

function defaultLoadRsdoctor(): ReturnType<LoadRsdoctor> {
  const require = createRequire(import.meta.url);
  return require(RSDOCTOR_PACKAGE) as ReturnType<LoadRsdoctor>;
}

/**
 * Resolve the Rsdoctor Rspack plugin for `tools.rspack`, or `false` when disabled.
 * Exported for tests.
 */
export function resolveRsdoctorPlugin(
  rsdoctor: RsdoctorConfig = false,
  load: LoadRsdoctor = defaultLoadRsdoctor,
): RsdoctorRspackPluginInstance | false {
  if (!shouldEnableRsdoctor(rsdoctor)) {
    return false;
  }

  const options = resolveRsdoctorPluginOptions(rsdoctor);

  try {
    const { RsdoctorRspackPlugin } = load();
    return new RsdoctorRspackPlugin(options);
  } catch (error) {
    if (!isModuleNotFound(error)) {
      throw error;
    }

    throw new Error(
      `Rsdoctor is enabled but \`${RSDOCTOR_PACKAGE}\` is not installed. Add it with \`pnpm add -D ${RSDOCTOR_PACKAGE}\`.`,
      { cause: error },
    );
  }
}

function resolvePlugins(
  publint: LibOptions['publint'] = true,
  attw: LibOptions['attw'] = true,
): NonNullable<RslibConfig['plugins']> {
  const plugins: NonNullable<RslibConfig['plugins']> = [];

  if (publint !== false) {
    plugins.push(pluginPublint(publint === true ? undefined : publint));
  }

  const attwOptions = resolveAttwOptions(attw);
  if (attwOptions !== false) {
    plugins.push(pluginAreTheTypesWrong(attwOptions));
  }

  return plugins;
}

/**
 * Opinionated preset for building a pure ESM library.
 */
export function lib(
  {
    entry = 'index',
    inlineDeps = [],
    publint = true,
    attw = true,
    rsdoctor = false,
  }: LibOptions = {},
  overrides: RslibConfig = {},
): RslibConfig {
  const resolved = resolveEntry(entry);
  const rsdoctorPlugin = resolveRsdoctorPlugin(rsdoctor);

  return mergeRslibConfig(
    {
      lib: [
        {
          format: 'esm',
          bundle: resolved.bundle,
          dts: true,
        },
      ],
      source: {
        entry: resolved.entry,
      },
      plugins: resolvePlugins(publint, attw),
      ...(rsdoctorPlugin
        ? {
            tools: {
              rspack: {
                plugins: [rsdoctorPlugin],
              },
            },
          }
        : {}),
      ...(inlineDeps.length > 0
        ? {
            output: {
              autoExternal: {
                exclude: inlineDeps,
              },
            },
          }
        : {}),
    },
    overrides,
  );
}

/**
 * Opinionated preset for building a Node.js-targeted ESM library.
 */
export function nodeLib(
  options: LibOptions = {},
  overrides: RslibConfig = {},
): RslibConfig {
  return lib(
    options,
    mergeRslibConfig(
      {
        output: {
          target: 'node',
        },
      },
      overrides,
    ),
  );
}
