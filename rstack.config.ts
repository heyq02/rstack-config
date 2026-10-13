// Configuration guide: https://rstack.rs/config
import { define } from 'rstack';
import { rstack } from './src/rstack/index.ts';

// Self-host through the unified Rstack CLI preset (define.extends).
define.extends([
  rstack({
    lib: {
      entry: {
        'rslint/index': './src/rslint/index.ts',
        'rslib/index': './src/rslib/index.ts',
        'fmt/index': './src/fmt/index.ts',
        'test/index': './src/test/index.ts',
        'staged/index': './src/staged/index.ts',
        'commitlint/index': './src/commitlint/index.ts',
        'rstack/index': './src/rstack/index.ts',
      },
      publint: true,
      attw: true,
      // RSDOCTOR=true rs lib — CI writes .rsdoctor and skips the client server.
      rsdoctor: true,
    },
    lint: {
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
    },
    fmt: {
      singleQuote: true,
      sortPackageJson: true,
      ignorePatterns: ['.github/**'],
    },
    test: {
      extends: {},
      strictCoverage: true,
    },
    staged: {
      formatAll: true,
      lintFix: true,
    },
  }),
]);
