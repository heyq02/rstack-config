import { mergeRslibConfig, type RslibConfig } from '@rslib/core';
import {
  pluginPublint,
  type PluginPublintOptions,
} from 'rsbuild-plugin-publint';
import { pluginAttw, resolveAttwOptions, type AttwConfig } from './attw.ts';

export type { AttwConfig, AttwOptions, AttwRule } from './attw.ts';

type Entry = NonNullable<NonNullable<RslibConfig['source']>['entry']>;

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
   * Built-in [`@arethetypeswrong/core`](https://www.npmjs.com/package/@arethetypeswrong/core).
   * API aligned with [tsdown attw](https://tsdown.dev/options/lint).
   * - omit / `true`: enabled with defaults (`profile: 'esm-only'`)
   * - `false`: disabled
   * - `'ci-only'`: only enabled when `process.env.CI` is set
   * - object: `{ enabled, profile, level, ignoreRules, ... }`
   */
  attw?: AttwConfig;
}

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
    plugins.push(pluginAttw(attwOptions));
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
