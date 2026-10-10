# @heyq02/rstack-config

<!-- automd:badges license codecov bundlephobia -->

[![npm version](https://img.shields.io/npm/v/@heyq02/rstack-config)](https://npmjs.com/package/@heyq02/rstack-config)
[![npm downloads](https://img.shields.io/npm/dm/@heyq02/rstack-config)](https://npm.chart.dev/@heyq02/rstack-config)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@heyq02/rstack-config)](https://bundlephobia.com/package/@heyq02/rstack-config)
[![codecov](https://img.shields.io/codecov/c/gh/heyq02/rstack-config)](https://codecov.io/gh/heyq02/rstack-config)
[![license](https://img.shields.io/github/license/heyq02/rstack-config)](https://github.com/heyq02/rstack-config/blob/main/LICENSE)

<!-- /automd -->

Opinionated [Rstack](https://rstack.rs/) presets: [Rslint](https://rslint.rs/) flat-config and [Rslib](https://rslib.rs/) library config in one package, with **tree-shakeable subpath exports**.

Aggregates [`@heyq02/rslint-config`](https://github.com/heyq02/rslint-config) and [`@heyq02/rslib-config`](https://github.com/heyq02/rslib-config).

## Features

- Separate entry points: `@heyq02/rstack-config/rslint` and `@heyq02/rstack-config/rslib`
- `sideEffects: false` + distinct ESM bundles so unused configs are dropped by bundlers
- Optional peers: install only `@rslint/core` and/or `@rslib/core` for the entry you use
- Same APIs as the previous standalone packages

## Install

```bash
# Lint preset
pnpm add -D @heyq02/rstack-config @rslint/core

# Library build preset
pnpm add -D @heyq02/rstack-config @rslib/core
```

## Usage

### Rslint — `@heyq02/rstack-config/rslint`

```ts
// rslint.config.ts
import { heyq02 } from '@heyq02/rstack-config/rslint';

export default heyq02({
  typescript: { typeChecked: true, strict: true },
  react: true,
  jest: false,
});
```

Append project overrides as extra arguments:

```ts
export default heyq02(
  { typescript: true },
  {
    rules: {
      'no-console': 'off',
    },
  },
);
```

### Rslib — `@heyq02/rstack-config/rslib`

```ts
// rslib.config.ts
import { defineConfig } from '@rslib/core';
import { lib, nodeLib } from '@heyq02/rstack-config/rslib';

export default defineConfig(lib());
// export default defineConfig(nodeLib());
```

Pass a second argument to override any Rslib config:

```ts
export default defineConfig(nodeLib({ entry: 'all' }, { syntax: 'es2021' }));
```

### Tree shaking

Import only the subpath you need. There is no root barrel export, so a lint-only consumer never loads the Rslib entry (and vice versa):

| Subpath                        | Exports                              | Peer (optional) |
| ------------------------------ | ------------------------------------ | --------------- |
| `@heyq02/rstack-config/rslint` | `heyq02`, presets, configs, globs, … | `@rslint/core`  |
| `@heyq02/rstack-config/rslib`  | `lib`, `nodeLib`, attw helpers       | `@rslib/core`   |

## Options

### Rslint options

| Option           | Default             | Description                                                                                   |
| ---------------- | ------------------- | --------------------------------------------------------------------------------------------- |
| `typescript`     | auto (`typescript`) | `true` / `false` / `{ typeChecked, strict, stylistic, projectService }`                       |
| `javascript`     | `true`              | JavaScript recommended + opinionated rules                                                    |
| `unicorn`        | `true`              | Unicorn recommended + overrides                                                               |
| `imports`        | `true`              | Import recommended + no-default-export, etc.                                                  |
| `sortImports`    | `true`              | `true` / `false` / Oxfmt-like `{ groups, newlinesBetween, customGroups, … }` → `import/order` |
| `node`           | `true` (`module`)   | `true` / `'module'` / `'script'` / `'mixed'`                                                  |
| `promise`        | `true`              | Promise recommended (relaxed for async/await)                                                 |
| `react`          | auto (`react`)      | React + React Hooks (+ jsx-a11y)                                                              |
| `jsxA11y`        | with react          | JSX accessibility rules                                                                       |
| `jest`           | auto (`jest`)       | Jest recommended + style                                                                      |
| `rstest`         | auto (`rstest`)     | Rstest recommended                                                                            |
| `unusedImports`  | `true`              | `eslint-plugin-unused-imports` (autofix unused imports)                                       |
| `regexp`         | `true`              | `eslint-plugin-regexp`                                                                        |
| `deMorgan`       | `true`              | `eslint-plugin-de-morgan`                                                                     |
| `eslintComments` | `true`              | `@eslint-community/eslint-plugin-eslint-comments`                                             |
| `isInEditor`     | auto                | Soften unused-import rules in VS Code / JetBrains / Vim                                       |
| `ignores`        | `[]`                | Extra global ignore patterns                                                                  |

### Rslib options

```ts
lib({
  // 'index' | 'shallow' | 'all' | custom source.entry
  entry: 'index',
  // Bundle these deps instead of externalizing them
  inlineDeps: ['lodash', /^@scope\//],
  // Built-in rsbuild-plugin-publint (default: true)
  publint: true,
  // Built-in @arethetypeswrong/core (default: true, profile: 'esm-only')
  attw: true,
});
```

| Option       | Default   | Description                                                                                                                                                                                                                                          |
| ------------ | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `entry`      | `'index'` | `'index'` bundles `src/index.ts`. `'shallow'` is bundleless `src/*`. `'all'` is bundleless `src/**`. A custom value is passed through to `source.entry`.                                                                                             |
| `inlineDeps` | `[]`      | Dependencies to bundle instead of externalize. Mapped to `output.autoExternal.exclude`.                                                                                                                                                              |
| `publint`    | `true`    | `true` enables [`rsbuild-plugin-publint`](https://github.com/rstackjs/rsbuild-plugin-publint). `false` disables it. An object is passed to `pluginPublint()`.                                                                                        |
| `attw`       | `true`    | `true` enables attw with `profile: 'esm-only'`. `false` disables it. `'ci-only'` runs only when `process.env.CI` is set. An object is `{ enabled, profile, level, ignoreRules, ... }`, same shape as [tsdown attw](https://tsdown.dev/options/lint). |

## Migration

```diff
- import { heyq02 } from '@heyq02/rslint-config';
+ import { heyq02 } from '@heyq02/rstack-config/rslint';

- import { lib, nodeLib } from '@heyq02/rslib-config';
+ import { lib, nodeLib } from '@heyq02/rstack-config/rslib';
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

Release notes live in [CHANGELOG.md](./CHANGELOG.md). Pushing a `v*` tag runs CI (`changelogithub` + npm publish). Sync existing tags with `pnpm run changelog:sync`.

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
