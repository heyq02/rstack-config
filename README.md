# @heyq02/rstack-config

<p>
  <a href="https://npmjs.com/package/@heyq02/rstack-config?activeTab=readme"><img src="https://img.shields.io/npm/v/@heyq02/rstack-config?style=flat-square&colorA=564341&colorB=EDED91" alt="npm version" /></a>
  <a href="https://npmcharts.com/compare/@heyq02/rstack-config?minimal=true"><img src="https://img.shields.io/npm/dm/@heyq02/rstack-config.svg?style=flat-square&colorA=564341&colorB=EDED91" alt="downloads" /></a>
  <a href="https://nodejs.org/en/about/previous-releases"><img src="https://img.shields.io/node/v/@heyq02/rstack-config.svg?style=flat-square&colorA=564341&colorB=EDED91" alt="node version"></a>
  <a href="https://github.com/heyq02/rstack-config/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square&colorA=564341&colorB=EDED91" alt="license" /></a>
</p>

Opinionated [Rstack CLI](https://rstack.rs/) presets — the Rstack counterpart of the sxzz toolchain split (`@sxzz/eslint-config` + `@sxzz/prettier-config` + `tsdown-preset-sxzz`), with **tree-shakeable subpaths** and a unified `define.extends` entry.

See [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) for the mapping and design notes.

## Features

- Tool subpaths: `rslint` / `rslib` / `fmt` / `test` / `staged`
- Unified `rstack()` → `RstackConfig` for `define.extends([...])`
- `sideEffects: false` + distinct ESM bundles
- Optional peers: install only the tools you use
- Lazy factories so `rs lint` does not load the Rslib graph

## Install

```bash
pnpm add -D @heyq02/rstack-config rstack @rslint/core @rslib/core
```

## Usage

### Preferred — Rstack CLI shared config

```ts
// rstack.config.ts
import { define } from 'rstack';
import { rstack } from '@heyq02/rstack-config/rstack';

define.extends([
  rstack({
    lib: { entry: 'index' },
    lint: { typescript: true, rstest: true },
  }),
]);

// Optional project overrides (merge on top of the shared preset):
define.fmt({ printWidth: 100 });
```

### Pick tools (maximum tree-shaking)

```ts
import { define } from 'rstack';
import { lint } from '@heyq02/rstack-config/rslint';
import { nodeLib } from '@heyq02/rstack-config/rslib';
import { fmt } from '@heyq02/rstack-config/fmt';
import { test } from '@heyq02/rstack-config/test';
import { staged } from '@heyq02/rstack-config/staged';

define.lib(() => nodeLib());
define.lint(() => lint({ typescript: true }));
define.fmt(fmt());
define.test(test());
define.staged(staged());
```

### Community mapping

| Subpath                        | Role                                     | Inspired by             |
| ------------------------------ | ---------------------------------------- | ----------------------- |
| `@heyq02/rstack-config/rslint` | `lint()` Rslint flat-config              | `@sxzz/eslint-config`   |
| `@heyq02/rstack-config/fmt`    | `fmt()` for `rs fmt` / `define.fmt`      | `@sxzz/prettier-config` |
| `@heyq02/rstack-config/rslib`  | `lib()` / `nodeLib()`                    | `tsdown-preset-sxzz`    |
| `@heyq02/rstack-config/test`   | `test()` for `rs test`                   | Rstack-native           |
| `@heyq02/rstack-config/staged` | `staged()` for `rs staged`               | Rstack-native           |
| `@heyq02/rstack-config/rstack` | `rstack()` → `define.extends` shared cfg | Rstack `define.extends` |

There is no root `.` export — pick a subpath.

## Options

### `rstack()`

| Option   | Default                    | Description                     |
| -------- | -------------------------- | ------------------------------- |
| `lib`    | `{}`                       | `LibOptions` or `false` to omit |
| `node`   | `true`                     | Use `nodeLib` instead of `lib`  |
| `lint`   | Node library lint defaults | `lint` options or `false`       |
| `fmt`    | `{}`                       | `fmt()` options or `false`      |
| `test`   | `{}`                       | `test()` options or `false`     |
| `staged` | `{}`                       | `staged()` options or `false`   |

### Rslint — `lint()`

| Option           | Default             | Description                                                             |
| ---------------- | ------------------- | ----------------------------------------------------------------------- |
| `typescript`     | auto (`typescript`) | `true` / `false` / `{ typeChecked, strict, stylistic, projectService }` |
| `javascript`     | `true`              | JavaScript recommended + opinionated rules                              |
| `unicorn`        | `true`              | Unicorn recommended + overrides                                         |
| `imports`        | `true`              | Import recommended + no-default-export, etc.                            |
| `sortImports`    | `true`              | `true` / `false` / Oxfmt-like options → `import/order`                  |
| `node`           | `true` (`module`)   | `true` / `'module'` / `'script'` / `'mixed'`                            |
| `promise`        | `true`              | Promise recommended                                                     |
| `react`          | auto (`react`)      | React + React Hooks (+ jsx-a11y)                                        |
| `jest`           | auto (`jest`)       | Jest recommended                                                        |
| `rstest`         | auto (`rstest`)     | Rstest recommended                                                      |
| `unusedImports`  | `true`              | `eslint-plugin-unused-imports`                                          |
| `regexp`         | `true`              | `eslint-plugin-regexp`                                                  |
| `deMorgan`       | `true`              | `eslint-plugin-de-morgan`                                               |
| `eslintComments` | `true`              | `@eslint-community/eslint-plugin-eslint-comments`                       |
| `ignores`        | `[]`                | Extra global ignore patterns                                            |

### Rslib — `lib()` / `nodeLib()`

| Option       | Default   | Description                                                                                                                                                                                                         |
| ------------ | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `entry`      | `'index'` | `'index'` / `'shallow'` / `'all'` / custom `source.entry`                                                                                                                                                           |
| `inlineDeps` | `[]`      | Bundle instead of externalize                                                                                                                                                                                       |
| `publint`    | `true`    | [`rsbuild-plugin-publint`](https://github.com/rstackjs/rsbuild-plugin-publint)                                                                                                                                      |
| `attw`       | `true`    | [`rsbuild-plugin-arethetypeswrong`](https://github.com/rstackjs/rsbuild-plugin-arethetypeswrong) with ESM-only defaults. Needs TypeScript JS API (`typescript@npm:@typescript/typescript6` when using TS 7 / tsgo). |

### fmt / test / staged

```ts
fmt({
  singleQuote: true,
  sortPackageJson: true,
  ignorePatterns: ['.github/**'],
});
test({ strictCoverage: true });
staged({ formatAll: true, lintFix: true });
```

## Migration

```diff
- import { heyq02 } from '@heyq02/rslint-config';
+ import { lint } from '@heyq02/rstack-config/rslint';

- import { lib, nodeLib } from '@heyq02/rslib-config';
+ import { lib, nodeLib } from '@heyq02/rstack-config/rslib';

+ import { rstack } from '@heyq02/rstack-config/rstack';
+ define.extends([rstack()]);
```

## Development

```bash
pnpm install
pnpm run build
pnpm run lint
pnpm run typecheck
pnpm run test
pnpm run format   # automd + rs fmt
pnpm run check    # rs check + typecheck
pnpm release      # changelogen: bump, CHANGELOG.md, tag (then push)
```

## License

<!-- automd:contributors license=MIT author="heyq02" -->

Published under the [MIT](https://github.com/heyq02/rstack-config/blob/main/LICENSE) license.
Made by [@heyq02](https://github.com/heyq02) and [community](https://github.com/heyq02/rstack-config/graphs/contributors) 💛
<br><br>
<a href="https://github.com/heyq02/rstack-config/graphs/contributors">
<img src="https://contrib.rocks/image?repo=heyq02/rstack-config" />
</a>

<!-- /automd -->

<!-- automd:with-automd -->

---

_🤖 auto updated with [automd](https://automd.unjs.io)_

<!-- /automd -->
