import { execFile } from 'node:child_process';
import { readFile, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { promisify, styleText } from 'node:util';
import { rsbuild, type RsbuildPlugin } from '@rslib/core';
import type {
  CheckPackageOptions,
  Problem,
  ProblemKind,
} from '@arethetypeswrong/core';

const execFileAsync = promisify(execFile);

const problemFlags = {
  NoResolution: 'no-resolution',
  UntypedResolution: 'untyped-resolution',
  FalseCJS: 'false-cjs',
  FalseESM: 'false-esm',
  CJSResolvesToESM: 'cjs-resolves-to-esm',
  FallbackCondition: 'fallback-condition',
  CJSOnlyExportsDefault: 'cjs-only-exports-default',
  NamedExports: 'named-exports',
  FalseExportDefault: 'false-export-default',
  MissingExportEquals: 'missing-export-equals',
  UnexpectedModuleSyntax: 'unexpected-module-syntax',
  InternalResolutionError: 'internal-resolution-error',
} as const satisfies Record<ProblemKind, string>;

export type AttwRule = (typeof problemFlags)[ProblemKind];

/**
 * ATTW options aligned with [tsdown's attw API](https://tsdown.dev/options/lint).
 */
export interface AttwOptions extends CheckPackageOptions {
  /**
   * Whether to enable attw.
   * - `true` / omit: enabled
   * - `false`: disabled
   * - `'ci-only'`: only enabled when `process.env.CI` is set
   * @default true
   */
  enabled?: boolean | 'ci-only';
  /**
   * Profiles select a set of resolution modes to require/ignore.
   * - `strict`: requires all resolutions
   * - `node16`: ignores node10 resolution failures
   * - `esm-only`: ignores CJS resolution failures
   * @default 'esm-only'
   */
  profile?: 'strict' | 'node16' | 'esm-only';
  /**
   * - `error`: fails the build
   * - `warn`: warns only
   * @default 'error'
   */
  level?: 'error' | 'warn';
  /**
   * Problem types to ignore by rule name.
   * @default []
   */
  ignoreRules?: AttwRule[];
}

export type AttwConfig = boolean | 'ci-only' | AttwOptions;

const profiles: Record<NonNullable<AttwOptions['profile']>, string[]> = {
  strict: [],
  node16: ['node10'],
  'esm-only': ['node10', 'node16-cjs'],
};

export function isFeatureEnabled(
  enabled: boolean | 'ci-only' | undefined,
  defaultEnabled = true,
): boolean {
  if (enabled === undefined) {
    return defaultEnabled;
  }
  if (enabled === 'ci-only') {
    return Boolean(process.env.CI);
  }
  return enabled;
}

export function resolveAttwOptions(
  attw: AttwConfig | undefined = true,
): AttwOptions | false {
  if (attw === false) {
    return false;
  }

  if (attw === true) {
    return {};
  }

  if (attw === 'ci-only') {
    return isFeatureEnabled('ci-only') ? {} : false;
  }

  const { enabled = true, ...options } = attw;
  return isFeatureEnabled(enabled) ? options : false;
}

function formatProblem(packageName: string, problem: Problem): string {
  const resolutionKind =
    'resolutionKind' in problem ? ` (${problem.resolutionKind})` : '';
  const entrypoint =
    'entrypoint' in problem
      ? ` at ${join(packageName, problem.entrypoint)}`
      : '';

  switch (problem.kind) {
    case 'NoResolution':
      return `No resolution${resolutionKind}${entrypoint}`;
    case 'UntypedResolution':
      return `Untyped resolution${resolutionKind}${entrypoint}`;
    case 'FalseESM':
      return `False ESM: types indicate ESM but implementation is CJS${entrypoint}`;
    case 'FalseCJS':
      return `False CJS: types indicate CJS but implementation is ESM${entrypoint}`;
    case 'CJSResolvesToESM':
      return `CJS resolves to ESM${resolutionKind}${entrypoint}`;
    case 'NamedExports': {
      const missing =
        problem.missing.length > 0
          ? ` (missing: ${problem.missing.join(', ')})`
          : '';
      return `Named exports problem${missing}${entrypoint}`;
    }
    case 'FallbackCondition':
      return `Fallback condition used${resolutionKind}${entrypoint}`;
    case 'FalseExportDefault':
      return `False export default${entrypoint}`;
    case 'MissingExportEquals':
      return `Missing export equals${entrypoint}`;
    case 'InternalResolutionError':
      return `Internal resolution error in ${problem.fileName}`;
    case 'UnexpectedModuleSyntax':
      return `Unexpected module syntax in ${problem.fileName}`;
    case 'CJSOnlyExportsDefault':
      return `CJS only exports default in ${problem.fileName}`;
    default:
      return `Unknown problem: ${JSON.stringify(problem)}`;
  }
}

/** Args used by attw to pack the package for type checks. Exported for tests. */
export const PNPM_PACK_ARGS = [
  'pack',
  '--json',
  // Skip prepare/prepack so lifecycle logs cannot pollute JSON stdout.
  '--config.ignore-scripts=true',
] as const;

/**
 * `execFile` does not resolve `.cmd` shims on Windows.
 * Exported for tests.
 */
export function resolvePnpmBin(
  platform: NodeJS.Platform = process.platform,
): string {
  return platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
}

function parsePackStdout(stdout: string): { filename: string } {
  const packed = JSON.parse(stdout) as
    { filename: string } | { filename: string }[];
  const filename = Array.isArray(packed)
    ? packed[0]?.filename
    : packed.filename;
  if (!filename) {
    throw new Error('attw: pnpm pack did not return a tarball filename');
  }
  return { filename };
}

async function packPackage(pkgDir: string): Promise<Uint8Array> {
  // Prefer pnpm when the package declares it (avoids npm devEngines mismatch).
  // win32: execFile cannot resolve pnpm.cmd without an explicit name;
  // shell:true avoids spawn EINVAL with .cmd on Windows.
  const isWin = process.platform === 'win32';
  const { stdout } = await execFileAsync(
    resolvePnpmBin(),
    [...PNPM_PACK_ARGS],
    {
      cwd: pkgDir,
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024,
      shell: isWin,
    },
  );

  const { filename } = parsePackStdout(stdout);

  const tarballPath = join(pkgDir, filename);
  try {
    const data = await readFile(tarballPath);
    return new Uint8Array(data);
  } finally {
    await unlink(tarballPath).catch(() => undefined);
  }
}

/**
 * Rsbuild plugin that runs Are the types wrong? after build.
 */
export function pluginAttw(options: AttwOptions = {}): RsbuildPlugin {
  const {
    enabled = true,
    profile = 'esm-only',
    level = 'error',
    ignoreRules = [],
    ...checkOptions
  } = options;

  return {
    name: 'plugin-attw',
    setup(api) {
      if (!isFeatureEnabled(enabled)) {
        return;
      }

      api.onAfterBuild({
        order: 'post',
        handler: async ({ isFirstCompile, isWatch }) => {
          if (!isFirstCompile) {
            return;
          }

          const attwCore = await import('@arethetypeswrong/core');

          const invalidRules = ignoreRules.filter(
            (rule) => !(Object.values(problemFlags) as string[]).includes(rule),
          );
          if (invalidRules.length > 0) {
            rsbuild.logger.warn(
              `attw ignoreRules contains invalid value(s): ${invalidRules.join(', ')}`,
            );
          }

          const tarball = await packPackage(api.context.rootPath);
          const pkg = attwCore.createPackageFromTarballData(tarball);
          const checkResult = await attwCore.checkPackage(pkg, checkOptions);

          let errorMessage: string | undefined;
          if (checkResult.types) {
            const problems = checkResult.problems.filter((problem) => {
              if (ignoreRules.includes(problemFlags[problem.kind])) {
                return false;
              }
              if ('resolutionKind' in problem) {
                return !profiles[profile]?.includes(problem.resolutionKind);
              }
              return true;
            });

            if (problems.length > 0) {
              errorMessage = problems
                .map((problem) =>
                  formatProblem(checkResult.packageName, problem),
                )
                .join('\n');
            }
          } else {
            errorMessage = 'Package has no types';
          }

          if (!errorMessage) {
            rsbuild.logger.info(styleText('green', 'ATTW passed.'));
            return;
          }

          const header = styleText(
            level === 'error' ? 'red' : 'yellow',
            `ATTW found problems:\n${errorMessage}`,
          );

          if (level === 'error') {
            rsbuild.logger.error(header);
            if (!isWatch) {
              throw new Error('ATTW failed!');
            }
            return;
          }

          rsbuild.logger.warn(header);
        },
      });
    },
  };
}
