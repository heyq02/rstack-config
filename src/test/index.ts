/**
 * Minimal Rstest config shape used by `define.test()`.
 * Kept structural so consumers do not need `@rstest/core` types at compile time.
 */
export interface TestOptions {
  /** Opt out of automatic app/lib adapter inheritance with `{}`. @default {} */
  extends?: Record<string, unknown>;
  /** @default 'node' */
  testEnvironment?: 'node' | 'jsdom' | 'happy-dom' | 'edge-runtime';
  /** Glob patterns for test files. Default: tests folder `*.test.ts`. */
  include?: string[];
  /** Coverage options; omit to disable thresholds. */
  coverage?: {
    provider?: 'v8' | 'istanbul';
    reporters?: string[];
    include?: string[];
    thresholds?: {
      statements?: number;
      branches?: number;
      functions?: number;
      lines?: number;
    };
  };
  [key: string]: unknown;
}

export interface NodeTestOptions extends TestOptions {
  /**
   * Enforce 100% coverage thresholds (statements/branches/functions/lines).
   * @default true
   */
  strictCoverage?: boolean;
}

/**
 * Opinionated Rstest preset for Node library packages.
 * Sets `extends: {}` so tests stay independent of the Rslib adapter.
 */
export function nodeTest({
  extends: extendsConfig = {},
  testEnvironment = 'node',
  include = ['tests/**/*.test.ts'],
  strictCoverage = true,
  coverage,
  ...rest
}: NodeTestOptions = {}): TestOptions {
  const defaultCoverage = {
    provider: 'v8' as const,
    reporters: ['text', 'json', 'html', 'lcov'],
    include: ['src/**/*.ts'],
    ...(strictCoverage
      ? {
          thresholds: {
            statements: 100,
            branches: 100,
            functions: 100,
            lines: 100,
          },
        }
      : {}),
  };

  return {
    extends: extendsConfig,
    testEnvironment,
    include,
    coverage: coverage ?? defaultCoverage,
    ...rest,
  };
}
