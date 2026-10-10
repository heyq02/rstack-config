import { expect, test } from 'rstack/test';
import { PNPM_PACK_ARGS, resolvePnpmBin } from '../src/rslib/attw.ts';
import { lib, nodeLib } from '../src/rslib/index.ts';

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
  expect(hasPlugin(config, 'plugin-attw')).toBe(true);
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
  expect(hasPlugin(config, 'plugin-attw')).toBe(true);
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

test('lib() disables attw when an options object sets enabled to false', () => {
  const previous = process.env.CI;
  delete process.env.CI;

  try {
    expect(
      hasPlugin(
        lib({ attw: { enabled: false, profile: 'strict' } }),
        'plugin-attw',
      ),
    ).toBe(false);
    expect(
      hasPlugin(lib({ attw: { enabled: 'ci-only' } }), 'plugin-attw'),
    ).toBe(false);
  } finally {
    if (previous === undefined) {
      delete process.env.CI;
    } else {
      process.env.CI = previous;
    }
  }
});

test('lib() can disable attw', () => {
  const config = lib({ attw: false });

  expect(hasPlugin(config, 'plugin-attw')).toBe(false);
  expect(hasPlugin(config, 'plugin-publint')).toBe(true);
});

test('lib() supports attw ci-only', () => {
  const previous = process.env.CI;
  delete process.env.CI;

  try {
    expect(hasPlugin(lib({ attw: 'ci-only' }), 'plugin-attw')).toBe(false);

    process.env.CI = 'true';
    expect(hasPlugin(lib({ attw: 'ci-only' }), 'plugin-attw')).toBe(true);
  } finally {
    if (previous === undefined) {
      delete process.env.CI;
    } else {
      process.env.CI = previous;
    }
  }
});

test('lib() forwards attw options', () => {
  const config = lib({
    attw: {
      profile: 'node16',
      level: 'warn',
      ignoreRules: ['false-cjs'],
    },
  });

  expect(hasPlugin(config, 'plugin-attw')).toBe(true);
});

test('attw pack ignores lifecycle scripts', () => {
  expect(PNPM_PACK_ARGS).toContain('--config.ignore-scripts=true');
  expect(PNPM_PACK_ARGS).toContain('--json');
});

test('attw pack resolves pnpm.cmd on Windows', () => {
  expect(resolvePnpmBin('win32')).toBe('pnpm.cmd');
  expect(resolvePnpmBin('linux')).toBe('pnpm');
  expect(resolvePnpmBin('darwin')).toBe('pnpm');
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
  expect(hasPlugin(config, 'plugin-attw')).toBe(true);
});

test('nodeLib() merges overrides without dropping target', () => {
  const config = nodeLib({}, { output: { minify: false } });

  expect(config.output?.target).toBe('node');
  expect(config.output?.minify).toBe(false);
});
