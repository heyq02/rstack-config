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
      app: false,
      lib: false,
      lint: false,
      fmt: false,
      test: false,
      staged: false,
    });

    expect(config.app).toBeUndefined();
    expect(config.lib).toBeUndefined();
    expect(config.lint).toBeUndefined();
    expect(config.fmt).toBeUndefined();
    expect(config.test).toBeUndefined();
    expect(config.staged).toBeUndefined();
  });

  test('app registers define.app and leaves the library build off', () => {
    const config = rstack({
      app: {
        source: { entry: { index: './src/index.tsx' } },
      },
    });

    expect(typeof config.app).toBe('function');
    expect(config.lib).toBeUndefined();
  });

  test('lib stays on when app and lib are both set', () => {
    const config = rstack({
      app: {},
      lib: { entry: 'index' },
      node: false,
    });

    expect(typeof config.app).toBe('function');
    expect(typeof config.lib).toBe('function');
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

  test('resolves app object and factory inputs', async () => {
    const objectConfig = rstack({
      app: { output: { assetPrefix: '/' } },
      lint: false,
      fmt: false,
      test: false,
      staged: false,
    });
    const factoryConfig = rstack({
      app: (env) => ({ output: { assetPrefix: `/${env.command}/` } }),
      lint: false,
      fmt: false,
      test: false,
      staged: false,
    });

    const appConfig = await (
      objectConfig.app as () => Promise<{ output?: { assetPrefix?: string } }>
    )();
    const fromFactory = await (
      factoryConfig.app as (env: {
        env: string;
        command: string;
      }) => Promise<{ output?: { assetPrefix?: string } }>
    )({
      env: 'production',
      command: 'build',
    });

    expect(appConfig.output?.assetPrefix).toBe('/');
    expect(fromFactory.output?.assetPrefix).toBe('/build/');
    expect(objectConfig.lib).toBeUndefined();
  });

  test('app lint turns off node/no-missing-import', async () => {
    const site = rstack({
      app: {},
      fmt: false,
      test: false,
      staged: false,
      lint: { typescript: true, node: 'mixed', react: true },
    });
    const library = rstack({
      app: false,
      lib: false,
      fmt: false,
      test: false,
      staged: false,
      lint: { typescript: true, node: 'mixed', react: false },
    });
    const nodeOff = rstack({
      app: {},
      fmt: false,
      test: false,
      staged: false,
      lint: { typescript: true, node: false, react: true },
    });

    const siteLint = await (site.lint as () => Promise<{ name?: string }[]>)();
    const libraryLint = await (
      library.lint as () => Promise<{ name?: string }[]>
    )();
    const nodeOffLint = await (
      nodeOff.lint as () => Promise<
        { name?: string; rules?: Record<string, unknown> }[]
      >
    )();

    const siteOverride = siteLint.find(
      (entry) => entry.name === 'rstack/app/extensionless-imports',
    ) as { rules?: Record<string, string> } | undefined;
    expect(siteOverride?.rules?.['node/no-missing-import']).toBe('off');
    expect(
      siteLint.findIndex(
        (entry) => entry.name === 'rstack/app/extensionless-imports',
      ),
    ).toBe(siteLint.length - 1);
    expect(
      libraryLint.some(
        (entry) => entry.name === 'rstack/app/extensionless-imports',
      ),
    ).toBe(false);
    expect(
      nodeOffLint.some(
        (entry) => entry.name === 'rstack/app/extensionless-imports',
      ),
    ).toBe(false);
  });
});
