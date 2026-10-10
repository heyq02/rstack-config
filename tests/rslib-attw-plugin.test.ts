import { execFile } from 'node:child_process';
import { readFile, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { rsbuild } from '@rslib/core';
import * as attwCore from '@arethetypeswrong/core';
import type { Problem } from '@arethetypeswrong/core';
import { afterEach, beforeEach, expect, rs, test } from 'rstack/test';
import {
  isFeatureEnabled,
  pluginAttw,
  resolvePnpmBin,
  type AttwOptions,
} from '../src/rslib/attw.ts';

const state = rs.hoisted(() => ({
  packStdout: JSON.stringify({ filename: 'pkg.tgz' }),
  unlinkError: null as Error | null,
}));

rs.mock('node:child_process', () => ({
  execFile: rs.fn(
    (
      _file: string,
      _args: readonly string[],
      _options: object,
      callback: (error: null, result: { stdout: string }) => void,
    ) => {
      callback(null, { stdout: state.packStdout });
    },
  ),
}));

rs.mock('node:fs/promises', () => ({
  readFile: rs.fn(async () => Buffer.from('tarball-bytes')),
  unlink: rs.fn(async () => {
    if (state.unlinkError) {
      throw state.unlinkError;
    }
  }),
}));

rs.mock('@arethetypeswrong/core', () => ({
  createPackageFromTarballData: rs.fn(() => ({ name: 'packed' })),
  checkPackage: rs.fn(),
}));

type BuildHandler = (context: {
  isFirstCompile: boolean;
  isWatch: boolean;
}) => Promise<void>;

function captureHandler(options?: AttwOptions): BuildHandler | undefined {
  const plugin = pluginAttw(options);
  let handler: BuildHandler | undefined;
  plugin.setup?.({
    context: { rootPath: '/virtual/pkg' },
    onAfterBuild(hook: { handler: BuildHandler }) {
      handler = hook.handler;
    },
  } as never);
  return handler;
}

async function runAttw(
  options?: AttwOptions,
  context: { isFirstCompile?: boolean; isWatch?: boolean } = {},
): Promise<void> {
  const handler = captureHandler(options);
  if (!handler) {
    throw new Error('attw hook was not registered');
  }
  await handler({
    isFirstCompile: context.isFirstCompile ?? true,
    isWatch: context.isWatch ?? false,
  });
}

function mockCheck(problems: Problem[], types: object | null = {}): void {
  rs.mocked(attwCore.checkPackage).mockResolvedValue({
    types: types ?? undefined,
    packageName: '@heyq02/pkg',
    problems,
  } as never);
}

beforeEach(() => {
  state.packStdout = JSON.stringify({ filename: 'pkg.tgz' });
  state.unlinkError = null;
  rs.mocked(execFile).mockClear();
  rs.mocked(readFile).mockClear();
  rs.mocked(unlink).mockClear();
  rs.mocked(attwCore.createPackageFromTarballData).mockClear();
  rs.mocked(attwCore.checkPackage).mockReset();
  mockCheck([]);
  rs.spyOn(rsbuild.logger, 'info').mockImplementation(() => undefined);
  rs.spyOn(rsbuild.logger, 'warn').mockImplementation(() => undefined);
  rs.spyOn(rsbuild.logger, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  rs.restoreAllMocks();
});

test('isFeatureEnabled defaults to enabled', () => {
  expect(isFeatureEnabled(undefined)).toBe(true);
  expect(isFeatureEnabled(undefined, false)).toBe(false);
});

test('pluginAttw skips registration when disabled', () => {
  expect(captureHandler({ enabled: false })).toBeUndefined();

  const previous = process.env.CI;
  delete process.env.CI;
  try {
    expect(captureHandler({ enabled: 'ci-only' })).toBeUndefined();
    process.env.CI = 'true';
    expect(captureHandler({ enabled: 'ci-only' })).toBeTypeOf('function');
  } finally {
    if (previous === undefined) {
      delete process.env.CI;
    } else {
      process.env.CI = previous;
    }
  }
});

test('skips attw after the first compile', async () => {
  await runAttw({}, { isFirstCompile: false });

  expect(execFile).not.toHaveBeenCalled();
  expect(attwCore.checkPackage).not.toHaveBeenCalled();
});

test('logs success when attw finds no problems', async () => {
  await runAttw();

  expect(execFile).toHaveBeenCalledWith(
    resolvePnpmBin(),
    ['pack', '--json', '--config.ignore-scripts=true'],
    expect.objectContaining({
      cwd: '/virtual/pkg',
      shell: process.platform === 'win32',
    }),
    expect.any(Function),
  );
  expect(readFile).toHaveBeenCalledWith(join('/virtual/pkg', 'pkg.tgz'));
  expect(unlink).toHaveBeenCalledWith(join('/virtual/pkg', 'pkg.tgz'));
  expect(attwCore.createPackageFromTarballData).toHaveBeenCalledWith(
    expect.any(Uint8Array),
  );
  expect(rsbuild.logger.info).toHaveBeenCalledWith(
    expect.stringContaining('ATTW passed.'),
  );
});

test('reads a tarball filename from a pnpm pack array and ignores unlink failures', async () => {
  state.packStdout = JSON.stringify([{ filename: 'arr.tgz' }]);
  state.unlinkError = new Error('busy');

  await runAttw();

  expect(readFile).toHaveBeenCalledWith(join('/virtual/pkg', 'arr.tgz'));
  expect(rsbuild.logger.info).toHaveBeenCalled();
});

test('fails when pnpm pack does not return a filename', async () => {
  state.packStdout = JSON.stringify([{ filename: '' }]);

  await expect(runAttw()).rejects.toThrow(
    'attw: pnpm pack did not return a tarball filename',
  );
  expect(readFile).not.toHaveBeenCalled();
});

test('reports every problem kind and fails the build', async () => {
  mockCheck([
    { kind: 'NoResolution', resolutionKind: 'bundler', entrypoint: '.' },
    {
      kind: 'UntypedResolution',
      resolutionKind: 'node16-esm',
      entrypoint: './sub',
    },
    { kind: 'FalseESM', entrypoint: '.' },
    { kind: 'FalseCJS' },
    { kind: 'CJSResolvesToESM', resolutionKind: 'node16-cjs', entrypoint: '.' },
    { kind: 'NamedExports', missing: ['foo', 'bar'], entrypoint: '.' },
    { kind: 'NamedExports', missing: [] },
    { kind: 'FallbackCondition', resolutionKind: 'node10', entrypoint: '.' },
    { kind: 'FalseExportDefault', entrypoint: '.' },
    { kind: 'MissingExportEquals' },
    { kind: 'InternalResolutionError', fileName: 'dist/index.d.ts' },
    { kind: 'UnexpectedModuleSyntax', fileName: 'dist/index.js' },
    { kind: 'CJSOnlyExportsDefault', fileName: 'dist/index.cjs' },
    { kind: 'Mystery' },
  ] as Problem[]);

  await expect(runAttw({ profile: 'strict', level: 'error' })).rejects.toThrow(
    'ATTW failed!',
  );

  const message = rs.mocked(rsbuild.logger.error).mock.calls[0]?.[0];
  expect(message).toEqual(expect.stringContaining('No resolution (bundler)'));
  expect(message).toEqual(
    expect.stringContaining('Untyped resolution (node16-esm)'),
  );
  expect(message).toEqual(
    expect.stringContaining(
      'False ESM: types indicate ESM but implementation is CJS',
    ),
  );
  expect(message).toEqual(
    expect.stringContaining(
      'False CJS: types indicate CJS but implementation is ESM',
    ),
  );
  expect(message).toEqual(
    expect.stringContaining('CJS resolves to ESM (node16-cjs)'),
  );
  expect(message).toEqual(
    expect.stringContaining('Named exports problem (missing: foo, bar)'),
  );
  expect(message).toEqual(expect.stringContaining('Named exports problem\n'));
  expect(message).toEqual(
    expect.stringContaining('Fallback condition used (node10)'),
  );
  expect(message).toEqual(expect.stringContaining('False export default'));
  expect(message).toEqual(expect.stringContaining('Missing export equals'));
  expect(message).toEqual(
    expect.stringContaining('Internal resolution error in dist/index.d.ts'),
  );
  expect(message).toEqual(
    expect.stringContaining('Unexpected module syntax in dist/index.js'),
  );
  expect(message).toEqual(
    expect.stringContaining('CJS only exports default in dist/index.cjs'),
  );
  expect(message).toEqual(expect.stringContaining('Unknown problem:'));
});

test('warns for an unknown profile and does not fail a watch build', async () => {
  mockCheck([
    { kind: 'FalseCJS' },
    { kind: 'NoResolution', resolutionKind: 'node10', entrypoint: '.' },
    { kind: 'NoResolution', resolutionKind: 'node16-cjs', entrypoint: '.' },
    { kind: 'NoResolution', resolutionKind: 'bundler', entrypoint: '.' },
  ] as Problem[]);

  await runAttw(
    {
      profile: 'not-a-profile' as 'strict',
      level: 'error',
      ignoreRules: ['false-cjs', 'not-a-rule' as 'false-cjs'],
    },
    { isWatch: true },
  );

  expect(rsbuild.logger.warn).toHaveBeenCalledWith(
    expect.stringContaining(
      'attw ignoreRules contains invalid value(s): not-a-rule',
    ),
  );
  const message = rs.mocked(rsbuild.logger.error).mock.calls[0]?.[0];
  expect(message).toEqual(expect.stringContaining('No resolution (node10)'));
  expect(message).toEqual(
    expect.stringContaining('No resolution (node16-cjs)'),
  );
  expect(message).toEqual(expect.stringContaining('No resolution (bundler)'));
  expect(message).not.toEqual(expect.stringContaining('False CJS'));
});

test('node16 profile ignores node10 and warn level does not throw', async () => {
  mockCheck([
    { kind: 'NoResolution', resolutionKind: 'node10', entrypoint: '.' },
    { kind: 'NoResolution', resolutionKind: 'node16-cjs', entrypoint: '.' },
  ] as Problem[]);

  await runAttw({ profile: 'node16', level: 'warn' });

  const message = rs.mocked(rsbuild.logger.warn).mock.calls[0]?.[0];
  expect(message).toEqual(
    expect.stringContaining('No resolution (node16-cjs)'),
  );
  expect(message).not.toEqual(expect.stringContaining('node10'));
  expect(rsbuild.logger.error).not.toHaveBeenCalled();
});

test('esm-only profile ignores CJS resolution failures', async () => {
  mockCheck([
    { kind: 'NoResolution', resolutionKind: 'node10', entrypoint: '.' },
    { kind: 'NoResolution', resolutionKind: 'node16-cjs', entrypoint: '.' },
    {
      kind: 'FallbackCondition',
      resolutionKind: 'node16-esm',
      entrypoint: './lib',
    },
  ] as Problem[]);

  await expect(runAttw({ profile: 'esm-only' })).rejects.toThrow(
    'ATTW failed!',
  );

  const message = rs.mocked(rsbuild.logger.error).mock.calls[0]?.[0];
  expect(message).toEqual(
    expect.stringContaining('Fallback condition used (node16-esm)'),
  );
  expect(message).not.toEqual(expect.stringContaining('node10'));
  expect(message).not.toEqual(expect.stringContaining('node16-cjs'));
});

test('fails when the package has no types', async () => {
  mockCheck([], null);

  await expect(runAttw()).rejects.toThrow('ATTW failed!');
  expect(rsbuild.logger.error).toHaveBeenCalledWith(
    expect.stringContaining('Package has no types'),
  );
});

test('packs with pnpm.cmd when process.platform is win32', async () => {
  const descriptor = Object.getOwnPropertyDescriptor(process, 'platform');
  Object.defineProperty(process, 'platform', { value: 'win32' });
  try {
    await runAttw();
    expect(execFile).toHaveBeenCalledWith(
      'pnpm.cmd',
      expect.any(Array),
      expect.objectContaining({ shell: true }),
      expect.any(Function),
    );
  } finally {
    if (descriptor) {
      Object.defineProperty(process, 'platform', descriptor);
    }
  }
});
