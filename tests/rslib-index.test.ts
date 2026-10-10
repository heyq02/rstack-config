import { describe, expect, test } from 'rstack/test';
import {
  ESM_ONLY_IGNORE_RESOLUTIONS,
  lib,
  nodeLib,
  resolveAttwOptions,
} from '../src/rslib/index.ts';

function hasPlugin(config: ReturnType<typeof lib>, name: string): boolean {
  return (config.plugins ?? []).some(
    (plugin) =>
      !!plugin &&
      typeof plugin === 'object' &&
      'name' in plugin &&
      plugin.name === name,
  );
}

test('lib() returns ESM preset with dts and index entry', () => {
  const config = lib();

  expect(config.lib).toEqual([
    {
      format: 'esm',
      bundle: true,
      dts: true,
    },
  ]);
  expect(config.source).toEqual({
    entry: { index: 'src/index.ts' },
  });
  expect(config.output?.target).toBeUndefined();
  expect(hasPlugin(config, 'plugin-publint')).toBe(true);
  expect(hasPlugin(config, 'plugin-arethetypeswrong')).toBe(true);
});

test('lib() passes through a custom entry', () => {
  expect(lib({ entry: { index: 'src/custom.ts' } })).toMatchObject({
    lib: [{ bundle: true }],
    source: { entry: { index: 'src/custom.ts' } },
  });
});

test('lib() supports shallow and all entry presets', () => {
  expect(lib({ entry: 'shallow' })).toMatchObject({
    lib: [{ bundle: false }],
    source: { entry: { index: 'src/*' } },
  });

  expect(lib({ entry: 'all' })).toMatchObject({
    lib: [{ bundle: false }],
    source: { entry: { index: 'src/**' } },
  });
});

test('lib() maps inlineDeps to autoExternal.exclude', () => {
  const config = lib({ inlineDeps: ['lodash', /^@scope\//] });

  expect(config.output?.autoExternal).toEqual({
    exclude: ['lodash', /^@scope\//],
  });
});

test('lib() accepts overrides', () => {
  const config = lib({}, { syntax: 'es2021' });

  expect(config.syntax).toBe('es2021');
});

test('lib() can disable publint', () => {
  const config = lib({ publint: false });

  expect(hasPlugin(config, 'plugin-publint')).toBe(false);
  expect(hasPlugin(config, 'plugin-arethetypeswrong')).toBe(true);
});

test('lib() forwards publint options', () => {
  const config = lib({
    publint: {
      enable: Boolean(process.env.CI),
      throwOn: 'warning',
    },
  });

  expect(hasPlugin(config, 'plugin-publint')).toBe(true);
});

test('lib() can disable attw', () => {
  const config = lib({ attw: false });

  expect(hasPlugin(config, 'plugin-arethetypeswrong')).toBe(false);
  expect(hasPlugin(config, 'plugin-publint')).toBe(true);
});

test('lib() supports attw ci-only', () => {
  const previous = process.env.CI;
  delete process.env.CI;

  try {
    expect(hasPlugin(lib({ attw: 'ci-only' }), 'plugin-arethetypeswrong')).toBe(
      false,
    );

    process.env.CI = 'true';
    expect(hasPlugin(lib({ attw: 'ci-only' }), 'plugin-arethetypeswrong')).toBe(
      true,
    );
  } finally {
    if (previous === undefined) {
      delete process.env.CI;
    } else {
      process.env.CI = previous;
    }
  }
});

test('lib() forwards attw plugin options', () => {
  const config = lib({
    attw: {
      enable: true,
      areTheTypesWrongOptions: {
        ignoreRules: ['false-cjs'],
        ignoreResolutions: ['node10'],
      },
    },
  });

  expect(hasPlugin(config, 'plugin-arethetypeswrong')).toBe(true);
});

test('lib() disables attw when enable is false', () => {
  const config = lib({ attw: { enable: false } });

  // Plugin is still registered; official plugin honors `enable` at runtime.
  expect(hasPlugin(config, 'plugin-arethetypeswrong')).toBe(true);
});

test('nodeLib() sets output.target to node', () => {
  const config = nodeLib();

  expect(config.output?.target).toBe('node');
  expect(config.lib).toEqual([
    {
      format: 'esm',
      bundle: true,
      dts: true,
    },
  ]);
  expect(hasPlugin(config, 'plugin-publint')).toBe(true);
  expect(hasPlugin(config, 'plugin-arethetypeswrong')).toBe(true);
});

test('nodeLib() merges overrides without dropping target', () => {
  const config = nodeLib({}, { output: { minify: false } });

  expect(config.output?.target).toBe('node');
  expect(config.output?.minify).toBe(false);
});

describe('resolveAttwOptions', () => {
  test('defaults to ESM-only ignoreResolutions', () => {
    expect(resolveAttwOptions(true)).toEqual({
      areTheTypesWrongOptions: {
        ignoreResolutions: [...ESM_ONLY_IGNORE_RESOLUTIONS],
      },
    });
    expect(resolveAttwOptions()).toEqual(resolveAttwOptions(true));
  });

  test('returns false when disabled', () => {
    expect(resolveAttwOptions(false)).toBe(false);
  });

  test('maps ci-only to enabled only when CI is set', () => {
    const previous = process.env.CI;
    delete process.env.CI;

    try {
      expect(resolveAttwOptions('ci-only')).toBe(false);

      process.env.CI = '1';
      expect(resolveAttwOptions('ci-only')).toEqual({
        areTheTypesWrongOptions: {
          ignoreResolutions: [...ESM_ONLY_IGNORE_RESOLUTIONS],
        },
      });
    } finally {
      if (previous === undefined) {
        delete process.env.CI;
      } else {
        process.env.CI = previous;
      }
    }
  });

  test('merges object options over ESM-only defaults', () => {
    expect(
      resolveAttwOptions({
        enable: true,
        areTheTypesWrongOptions: {
          ignoreRules: ['false-cjs'],
          ignoreResolutions: ['bundler'],
          summary: false,
        },
      }),
    ).toEqual({
      enable: true,
      areTheTypesWrongOptions: {
        ignoreResolutions: ['bundler'],
        ignoreRules: ['false-cjs'],
        summary: false,
      },
    });
  });
});
