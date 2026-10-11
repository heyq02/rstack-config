# Changelog

## Unreleased

### 🚀 Enhancements

- Add Rstack CLI presets aligned with the sxzz toolchain split: `./fmt`, `./test`, `./staged`, and unified `./rstack` for `define.extends`
- Self-host via `define.extends([rstack(...)])`

### 🏡 Chore

- Use official [`rsbuild-plugin-arethetypeswrong`](https://github.com/rstackjs/rsbuild-plugin-arethetypeswrong) instead of a custom attw plugin
- Keep [`rsbuild-plugin-publint`](https://github.com/rstackjs/rsbuild-plugin-publint) for package linting

## v0.0.1

### 🚀 Enhancements

- Aggregate `@heyq02/rslint-config` and `@heyq02/rslib-config` into `@heyq02/rstack-config`
- Tree-shakeable subpath exports: `./rslint` and `./rslib`
