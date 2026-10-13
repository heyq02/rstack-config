# AGENTS.md

## Commands

- `pnpm run build` - Build the library with `rs lib` (Rslib multi-entry)
- `pnpm run dev` - Watch mode rebuild (`rs lib --watch`)
- `pnpm run test` - Unit tests via `rs test` (Rstest)
- `pnpm run test:coverage` - Unit tests with V8 coverage (Codecov upload in CI)
- `pnpm run lint` - Lint with `rs lint` (Rslint)
- `pnpm run format` - Update README with automd, then format with `rs fmt`
- `pnpm run format:check` - Check formatting with `rs fmt --check`
- `pnpm run check` - `rs check` (lint + format:check) + typecheck
- `pnpm run check:package` - `pnpm run build` (publint + attw)
- `pnpm run automd` - Refresh automd sections in README.md
- `pnpm run typecheck` - Type-check with `tsc6 --noEmit` (`@typescript/typescript6`)
- `pnpm run commitlint` - Lint commit message(s) with Conventional Commits
- `pnpm release` / `bumpp` - Version bump via global `bumpp` (commit + tag + push); CI then publishes npm and creates the GitHub Release (`changelogithub`)

## Docs

- Rstack CLI: https://rstack.rs/llms.txt
- Rslib: https://rslib.rs/llms.txt
- Rsbuild: https://rsbuild.rs/llms.txt
- Rspack: https://rspack.rs/llms.txt
- Rstest: https://rstest.rs/llms.txt
- Rslint: https://rslint.rs/llms.txt

## Package layout

- `src/rslint/` — lint factory (sxzz eslint-config analogue) → `./rslint`
- `src/rslib/` — lib/nodeLib (tsdown-preset-sxzz analogue) → `./rslib`
- `src/fmt/` — `rs fmt` defaults (sxzz prettier-config analogue) → `./fmt`
- `src/test/` — `test()` → `./test`
- `src/staged/` — `staged()` → `./staged`
- `src/commitlint/` — `commitlint()` → `./commitlint` (one-liner `commitlint.config.js`)
- `src/rstack/` — unified `rstack()` for `define.extends` → `./rstack`
- No root `.` export — consumers must pick a subpath
- Self-host: `rstack.config.ts` uses `define.extends([rstack(...)])`; `commitlint.config.js` re-exports `./src/commitlint`

## Tools

### Split of responsibilities

- **Rstack CLI** (`rs`): build (`rs lib`), lint (`rs lint`), format (`rs fmt`), tests (`rs test`), hooks (`rs hooks`)
- **Rslib**: package build via local `nodeLib({ entry: { 'rslint/index', 'rslib/index' }, publint, attw })`
- **Package checks**: build-time [`rsbuild-plugin-publint`](https://github.com/rstackjs/rsbuild-plugin-publint) + [`rsbuild-plugin-arethetypeswrong`](https://github.com/rstackjs/rsbuild-plugin-arethetypeswrong) (ESM-only defaults)
- **TypeScript**: `typescript` resolves to `@typescript/typescript6` so attw can use the JS API; Rslib dts still uses tsgo
- **Rstest**: unit tests, with V8 coverage from `@rstest/coverage-v8`
- **Rslint**: lint through `rs lint` using local `src/rslint`

### Git hooks

- `prepare` runs `rs hooks`
- pre-commit (`.rstack/hooks/pre-commit`) runs `rs staged`
- commit-msg (`.rstack/hooks/commit-msg`) runs `commitlint` (Conventional Commits)
- staged tasks: `rs fmt` on all files, `rs lint --fix` on JS/TS

### Commit messages

Use [Conventional Commits](https://www.conventionalcommits.org/): `type(scope)?: subject`

Allowed types: `feat` `fix` `docs` `style` `refactor` `perf` `test` `build` `ci` `chore` `revert`

This keeps GitHub Releases (via `changelogithub` on tag push) useful — non-conventional subjects are dropped.

## Cursor Cloud specific instructions

- Cloud Agent environment is dashboard-managed (not repo-local `.cursor/`). Install should link Node `22.22.2` ahead of older image Node, activate `pnpm@12.10.1`, then `pnpm install --frozen-lockfile`.
- Rstack loads `rstack.config.ts` through Node's built-in TypeScript stripping, which is on by default in Node `>=22.18`. `rstack` itself requires Node `^22.18.0 || >=24.3.0`.
- This repo is a library preset, with no dev server to boot. `pnpm run dev` only rebuilds on file changes. Verify with `pnpm run lint`, `pnpm run test`, `pnpm run typecheck`, `pnpm run build`, and `pnpm run format:check`.
