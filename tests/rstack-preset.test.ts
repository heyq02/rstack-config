import { describe, expect, test } from 'rstack/test';
import { rstack } from '../src/rstack/index.ts';

describe('rstack()', () => {
  test('composes lib/lint/fmt/test/staged by default', () => {
    const config = rstack();

    expect(typeof config.lib).toBe('function');
    expect(typeof config.lint).toBe('function');
    expect(typeof config.fmt).toBe('function');
    expect(config.test).toMatchObject({
      testEnvironment: 'node',
      extends: {},
    });
    expect(config.staged).toEqual({
      '*': 'rs fmt --no-error-on-unmatched-pattern --ignore-unknown',
      '*.{js,jsx,ts,tsx,mjs,cjs,mts,cts}': 'rs lint --fix',
    });
  });

  test('can disable individual tools', () => {
    const config = rstack({
      lib: false,
      lint: false,
      fmt: false,
      test: false,
      staged: false,
    });

    expect(config.lib).toBeUndefined();
    expect(config.lint).toBeUndefined();
    expect(config.fmt).toBeUndefined();
    expect(config.test).toBeUndefined();
    expect(config.staged).toBeUndefined();
  });

  test('resolves fmt factory', async () => {
    const config = rstack({
      lib: false,
      lint: false,
      test: false,
      staged: false,
      fmt: { printWidth: 90 },
    });

    const fmtConfig = await (
      config.fmt as () => Promise<Record<string, unknown>>
    )();
    expect(fmtConfig).toMatchObject({
      printWidth: 90,
      singleQuote: true,
    });
  });

  test('resolves lint factory', async () => {
    const config = rstack({
      lib: false,
      fmt: false,
      test: false,
      staged: false,
      lint: { typescript: true, react: false, jest: false, rstest: false },
    });

    const lintConfig = await (config.lint as () => Promise<unknown[]>)();
    expect(Array.isArray(lintConfig)).toBe(true);
    expect(lintConfig.length).toBeGreaterThan(0);
  });

  test('resolves lib factory for node and neutral targets', async () => {
    const nodeConfig = rstack({
      lint: false,
      fmt: false,
      test: false,
      staged: false,
      node: true,
      lib: { entry: 'index' },
    });
    const neutralConfig = rstack({
      lint: false,
      fmt: false,
      test: false,
      staged: false,
      node: false,
      lib: { entry: 'index' },
    });

    const nodeLibConfig = await (
      nodeConfig.lib as () => Promise<{ output?: { target?: string } }>
    )();
    const libConfig = await (
      neutralConfig.lib as () => Promise<{ output?: { target?: string } }>
    )();

    expect(nodeLibConfig.output?.target).toBe('node');
    expect(libConfig.output?.target).toBeUndefined();
  });
});
