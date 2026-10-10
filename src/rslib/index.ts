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
  }: LibOptions = {},
  overrides: RslibConfig = {},
): RslibConfig {
  const resolved = resolveEntry(entry);

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
