# Contributing

Thanks for helping improve `@heyq02/rstack-config`.

## Setup

```bash
pnpm install
pnpm run check
pnpm run test
pnpm run build
```

Tooling split (see `AGENTS.md` / `rstack.config.ts`):

- **Rstack CLI**: `rs fmt`, `rs lint`, `rs test`, commit hooks (`rs hooks` / `rs staged`), library build (`rs lib`)

## Workflow

1. Branch from `main` (`cursor/…` is fine for agent PRs).
2. Keep changes focused; prefer one concern per PR.
3. Use the PR template checklist.
4. For bugs / features, prefer the issue forms under **New issue**.

## Commit messages

Commits must follow [Conventional Commits](https://www.conventionalcommits.org/) (enforced by `commit-msg` hook + CI):

```text
feat: add an option
fix: handle a Windows path
docs: add a badge
chore: release a new version
```

Allowed types: `feat` `fix` `docs` `style` `refactor` `perf` `test` `build` `ci` `chore` `revert`.

Local: `.rstack/hooks/commit-msg` → `pnpm exec commitlint --edit`.  
CI: `.github/workflows/commitlint.yml` lints the PR commit range.

This feeds `changelogen` so release notes / `CHANGELOG.md` stay accurate.

## Scripts

| Script                             | Purpose                              |
| ---------------------------------- | ------------------------------------ |
| `pnpm run lint` / `lint:fix`       | `rs lint` / `rs lint --fix`          |
| `pnpm run format` / `format:check` | automd + `rs fmt`                    |
| `pnpm run test` / `test:coverage`  | Rstest via `rs test` (+ V8 coverage) |
| `pnpm run typecheck`               | `tsc6 --noEmit`                      |
| `pnpm run check`                   | `rs check` + typecheck               |
| `pnpm run check:package`           | build (incl. publint + attw)         |
| `pnpm run commitlint`              | lint commit message(s)               |
| `pnpm run changelog`               | preview / update CHANGELOG           |
| `pnpm run changelog:sync`          | sync CHANGELOG → GH Releases         |
| `pnpm release`                     | bump + CHANGELOG + tag (maintainers) |

`autofix.ci` may push formatting / lint-fix commits on PRs. Do not rely on it to rewrite files under `.github/` (those are ignored by fmt).

## Package layout

- `src/rslint/` → `@heyq02/rstack-config/rslint` (`lint()`)
- `src/rslib/` → `@heyq02/rstack-config/rslib` (`lib()` / `nodeLib()`)
- `src/fmt/` → `@heyq02/rstack-config/fmt` (`fmt()`)
- `src/test/` → `@heyq02/rstack-config/test` (`test()`)
- `src/staged/` → `@heyq02/rstack-config/staged` (`staged()`)
- `src/rstack/` → `@heyq02/rstack-config/rstack` (`rstack()`)
- Keep subpaths independent so each export stays tree-shakeable.
