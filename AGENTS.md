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
- `pnpm run changelog` - Generate changelog section (changelogen → stdout / CHANGELOG.md)
- `pnpm run changelog:sync` - Sync CHANGELOG.md sections to GitHub Releases
- `pnpm release` - Bump version, update CHANGELOG.md, commit + tag (`changelogen --release --no-github`); push tags to publish via CI

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
- `src/rstack/` — unified `rstack()` for `define.extends` → `./rstack`
- `ARCHITECTURE.md` — design notes and community mapping
- No root `.` export — consumers must pick a subpath
- Self-host: `rstack.config.ts` uses `define.extends([rstack(...)])`

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

This keeps `changelogen` / GitHub Releases useful (non-conventional subjects are dropped from changelogs).

## Cursor Cloud specific instructions

- Cloud Agent setup lives in `.cursor/environment.json` and runs `bash .cursor/install.sh`. That script links Node `22.22.2` ahead of the image Node `22.14` at `/exec-daemon/node`, then runs `pnpm install --frozen-lockfile` (`packageManager` is `pnpm@12.10.1`).
- Rstack loads `rstack.config.ts` through Node's built-in TypeScript stripping, which is on by default in Node `>=22.18`. `rstack` itself requires Node `^22.18.0 || >=24.3.0`.
- This repo is a library preset, with no dev server to boot. `pnpm run dev` only rebuilds on file changes. Verify with `pnpm run lint`, `pnpm run test`, `pnpm run typecheck`, `pnpm run build`, and `pnpm run format:check`.
