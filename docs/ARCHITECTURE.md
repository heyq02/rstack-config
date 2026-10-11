# Architecture: Rstack CLI config presets

This package ports the sxzz “unified toolchain preset” pattern onto
[Rstack CLI](https://rstack.rs/) (`define.*` + `define.extends`).

## Community references

| sxzz / ecosystem                                                   | Role                               | Rstack CLI equivalent                       |
| ------------------------------------------------------------------ | ---------------------------------- | ------------------------------------------- |
| [`@sxzz/eslint-config`](https://github.com/sxzz/eslint-config)     | Lint factory + layered presets     | `@heyq02/rstack-config/rslint` (`lint()`) |
| [`@sxzz/prettier-config`](https://github.com/sxzz/prettier-config) | Shareable format defaults          | `@heyq02/rstack-config/fmt` (`fmt()`)       |
| [`tsdown-preset-sxzz`](https://github.com/sxzz/tsdown-preset-sxzz) | `lib()` / `nodeLib()` build preset | `@heyq02/rstack-config/rslib`               |
| _(Rstack-native)_                                                  | Tests / staged hooks               | `./test` (`test()`), `./staged` (`staged()`)    |
| _(Rstack-native)_                                                  | One shared config object           | `@heyq02/rstack-config/rstack` (`rstack()`) |

## Design principles (from those packages)

1. **One-line defaults** — `lint()`, `lib()`, `fmt()`, `test()`, `staged()`, `rstack()` work with zero options.
2. **Composable overrides** — second-arg / options object merges into tool configs.
3. **Feature auto-detect** — lint toggles follow installed packages (sxzz / antfu style).
4. **Tree-shakeable subpaths** — no root barrel; import only the tool you need.
5. **Lazy tool graphs** — `rstack()` uses async factories so `rs lint` does not load Rslib.
6. **Self-host** — this repo configures itself through the same public presets.

## Export map

```text
@heyq02/rstack-config/rslint  → `lint()` flat-config factory + presets
@heyq02/rstack-config/rslib   → lib() / nodeLib() (+ publint / attw)
@heyq02/rstack-config/fmt     → fmt() for define.fmt / rs fmt
@heyq02/rstack-config/test    → `test()` for define.test / rs test
@heyq02/rstack-config/staged  → staged() for define.staged / rs staged
@heyq02/rstack-config/rstack  → rstack() → RstackConfig for define.extends
```

## Recommended consumer shapes

### A. Full shared config (preferred for Rstack CLI)

```ts
import { define } from 'rstack';
import { rstack } from '@heyq02/rstack-config/rstack';

define.extends([
  rstack({
    lib: { entry: 'index' },
    lint: { typescript: true, rstest: true },
  }),
]);

// Optional project overrides:
define.fmt({ printWidth: 100 });
```

### B. Pick tools (sxzz-style, maximum tree-shaking)

```ts
import { define } from 'rstack';
import { lint } from '@heyq02/rstack-config/rslint';
import { nodeLib } from '@heyq02/rstack-config/rslib';
import { fmt } from '@heyq02/rstack-config/fmt';

define.lib(() => nodeLib());
define.lint(() => lint({ typescript: true }));
define.fmt(fmt());
```

## Non-goals

- Re-exporting Vue / Astro / Markdown lint layers that Rslint does not cover.
- Shipping a Prettier config file for the Prettier CLI — Rstack owns formatting via `rs fmt`.
- A root `.` export that aggregates every tool (would defeat subpath tree-shaking).
