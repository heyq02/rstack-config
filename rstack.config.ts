// Configuration guide: https://rstack.rs/config
import { define } from 'rstack';

// Self-hosted build: multi-entry so ./rslint and ./rslib stay separate bundles.
define.lib(async () => {
  const { nodeLib } = await import('./src/rslib/index.ts');

  return nodeLib({
    entry: {
      'rslint/index': './src/rslint/index.ts',
      'rslib/index': './src/rslib/index.ts',
    },
    publint: true,
    // Default profile is esm-only.
    attw: true,
  });
});

define.lint(async () => {
  const { heyq02 } = await import('./src/rslint/index.ts');

  return heyq02({
    typescript: true,
    node: 'module',
    react: false,
    jest: false,
    rstest: true,
    sortImports: true,
    unusedImports: true,
    regexp: true,
    deMorgan: true,
    eslintComments: true,
  });
});

define.fmt({
  singleQuote: true,
  // Keep package.json keywords in alphabetical order.
  sortPackageJson: true,
  // autofix.ci cannot modify `.github/`. Explicit paths bypass .gitignore.
  ignorePatterns: ['.github/**'],
});

define.staged({
  '*': 'rs fmt --no-error-on-unmatched-pattern --ignore-unknown',
  '*.{js,jsx,ts,tsx,mjs,cjs,mts,cts}': 'rs lint --fix',
});

// Unit tests import source directly and mock Node builtins, so they stay
// independent of the automatic Rslib test adapter.
define.test({
  extends: {},
  testEnvironment: 'node',
  include: ['tests/**/*.test.ts'],
  coverage: {
    provider: 'v8',
    reporters: ['text', 'json', 'html', 'lcov'],
    include: ['src/**/*.ts'],
    thresholds: {
      statements: 100,
      branches: 100,
      functions: 100,
      lines: 100,
    },
  },
});
