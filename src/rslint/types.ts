import type { RslintConfig, RslintConfigEntry } from '@rslint/core';

export type { RslintConfig, RslintConfigEntry };

export type TypedFlatConfig = RslintConfigEntry;

export type ResolvableConfig =
  TypedFlatConfig | TypedFlatConfig[] | RslintConfig | false | null | undefined;

export type TypeScriptPreset =
  'recommended' | 'recommendedTypeChecked' | 'strict' | 'strictTypeChecked';

export interface TypeScriptOptions {
  /**
   * Enable type-aware TypeScript rules.
   * When true, uses `*TypeChecked` presets and enables `projectService` by default.
   * @default false
   */
  typeChecked?: boolean;
  /**
   * Use TypeScript strict presets instead of recommended.
   * @default false
   */
  strict?: boolean;
  /**
   * Layer TypeScript stylistic rules after the baseline.
   * @default true
   */
  stylistic?: boolean;
  /**
   * Enable automatic TypeScript project discovery for type-aware rules.
   * Defaults to `true` when `typeChecked` is enabled.
   */
  projectService?: boolean;
}

export type NodePreset = boolean | 'module' | 'script' | 'mixed';

/**
 * `import/order` group names (Rslint / eslint-plugin-import).
 * Closest enforceable equivalent of Oxfmt perfectionist selectors.
 */
export type SortImportsGroup =
  | 'builtin'
  | 'external'
  | 'internal'
  | 'unknown'
  | 'parent'
  | 'sibling'
  | 'index'
  | 'object'
  | 'type';

/**
 * Oxfmt-like custom group → mapped to `import/order` `pathGroups`.
 *
 * @see https://oxc.rs/docs/guide/usage/formatter/sorting.html
 */
export interface SortImportsCustomGroup {
  /**
   * Display / documentation name (Oxfmt `groupName`).
   * Not a first-class `import/order` group — attach via {@link group}.
   */
  groupName?: string;
  /**
   * Glob patterns matched against the import source (Oxfmt `elementNamePattern`).
   */
  elementNamePattern: string | string[];
  /**
   * Target `import/order` group to attach to.
   * @default 'external'
   */
  group?: SortImportsGroup;
  /**
   * Position relative to {@link group}.
   * @default 'before'
   */
  position?: 'before' | 'after';
}

/**
 * Import sorting options, shaped like Oxfmt `sortImports` and implemented via
 * Rslint `import/order`.
 *
 * Unsupported Oxfmt knobs (no-op / not exposed): per-group `{ newlinesBetween }`,
 * `partitionByComment`, `partitionByNewline`, perfectionist modifier-selectors
 * (`value-builtin`, `type-import`, …).
 *
 * @see https://oxc.rs/docs/guide/usage/formatter/sorting.html
 */
export interface SortImportsOptions {
  /**
   * Relative order of import groups.
   * @default `['type', ['builtin', 'external'], 'internal', ['parent', 'sibling', 'index'], 'unknown']`
   */
  groups?: (SortImportsGroup | SortImportsGroup[])[];
  /**
   * Insert a blank line between groups.
   * Maps to `newlines-between: 'always' | 'never'`.
   * @default true
   */
  newlinesBetween?: boolean;
  /**
   * Custom path-based groups (Oxfmt `customGroups` → `pathGroups`).
   */
  customGroups?: SortImportsCustomGroup[];
  /**
   * Prefixes treated as internal imports (Oxfmt `internalPattern`).
   * Converted to `settings['import/internal-regex']`.
   * @default `['~/', '@/', '#']`
   */
  internalPattern?: string[];
  /**
   * Alphabetical order within each group.
   * @default 'asc'
   */
  order?: 'asc' | 'desc';
  /**
   * Case-insensitive alphabetical sort.
   * @default true
   */
  ignoreCase?: boolean;
  /**
   * Sort named import / export members.
   * @default true
   */
  named?: boolean;
  /**
   * Whether side-effect imports participate in ordering
   * (`warnOnUnassignedImports`).
   * @default false
   */
  sortSideEffects?: boolean;
}

export interface Options {
  /**
   * Global ignore patterns. Merged with the built-in excludes.
   */
  ignores?: string[];
  /**
   * Treat the process as an editor (VS Code / JetBrains / Vim).
   * When unset, auto-detected from editor environment variables.
   * In editor mode, unused-import rules are softened to reduce noise while typing.
   */
  isInEditor?: boolean;
  /**
   * JavaScript support. @default true
   */
  javascript?: boolean;
  /**
   * TypeScript support. Auto-enabled when `typescript` is installed.
   * Pass an object for type-checked / strict / stylistic controls.
   * @default auto
   */
  typescript?: boolean | TypeScriptOptions;
  /**
   * Unicorn rules. @default true
   */
  unicorn?: boolean;
  /**
   * Import rules. @default true
   */
  imports?: boolean;
  /**
   * Sort imports via `import/order`, with an Oxfmt-like options surface.
   * Enabled by default when {@link imports} is on.
   * Set `false` if Oxfmt `sortImports` already owns ordering.
   * @default true
   */
  sortImports?: boolean | SortImportsOptions;
  /**
   * Node.js rules.
   * - `true` / `'module'` — ESM-oriented Node rules (default)
   * - `'script'` — CommonJS-oriented
   * - `'mixed'` — upstream mixed recommended preset
   * @default true
   */
  node?: NodePreset;
  /**
   * Promise rules. @default true
   */
  promise?: boolean;
  /**
   * React + React Hooks. Auto-enabled when React is detected.
   * @default auto
   */
  react?: boolean;
  /**
   * JSX accessibility rules. Auto-enabled with React when unset.
   * @default auto with react
   */
  jsxA11y?: boolean;
  /**
   * Jest rules. Auto-enabled when `jest` is detected.
   * @default auto
   */
  jest?: boolean;
  /**
   * Rstest rules. Auto-enabled when `rstest` / `@rstest/core` is detected.
   * @default auto
   */
  rstest?: boolean;
  /**
   * Autofix unused imports (`eslint-plugin-unused-imports`).
   * @default true
   */
  unusedImports?: boolean;
  /**
   * RegExp rules (`eslint-plugin-regexp`).
   * @default true
   */
  regexp?: boolean;
  /**
   * De Morgan rewrites (`eslint-plugin-de-morgan`).
   * @default true
   */
  deMorgan?: boolean;
  /**
   * `eslint-disable` hygiene (`@eslint-community/eslint-plugin-eslint-comments`).
   * @default true
   */
  eslintComments?: boolean;
}
