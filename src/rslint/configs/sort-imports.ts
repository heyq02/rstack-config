import type { ImportOrderOptions } from '@rslint/core';
import type { SortImportsCustomGroup, SortImportsOptions } from '../types.ts';

/** eslint-plugin-import / Rslint `import/order` group names. */
export type ImportOrderGroup =
  | 'builtin'
  | 'external'
  | 'internal'
  | 'unknown'
  | 'parent'
  | 'sibling'
  | 'index'
  | 'object'
  | 'type';

type ImportOrderConfig = NonNullable<ImportOrderOptions[0]>;

/**
 * Default group order inspired by Oxfmt / perfectionist `sort-imports`
 * (type-first, then builtin+external, internal, relative, unknown).
 *
 * Mapped onto `import/order` groups — modifier-selectors like
 * `value-builtin` / `type-internal` are not expressible 1:1, so types are
 * collected via the dedicated `type` group.
 *
 * @see https://oxc.rs/docs/guide/usage/formatter/sorting.html
 */
export const DEFAULT_SORT_IMPORT_GROUPS: (
  ImportOrderGroup | ImportOrderGroup[]
)[] = [
  'type',
  ['builtin', 'external'],
  'internal',
  ['parent', 'sibling', 'index'],
  'unknown',
];

/** Oxfmt default prefixes for internal modules. */
export const DEFAULT_INTERNAL_PATTERN = ['~/', '@/', '#'];

const PREDEFINED_GROUPS = new Set<string>([
  'builtin',
  'external',
  'internal',
  'unknown',
  'parent',
  'sibling',
  'index',
  'object',
  'type',
]);

/**
 * Convert Oxfmt-style glob prefixes (`~/`, `@/`, `#`) into a single
 * `import/internal-regex` source string.
 */
export function internalPatternToRegex(patterns: string[]): string {
  const escaped = patterns
    .map((pattern) => pattern.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .filter(Boolean);

  if (escaped.length === 0) return '';
  return `^(?:${escaped.join('|')})`;
}

function toPatterns(value: string | string[]): string[] {
  return Array.isArray(value) ? value : [value];
}

/**
 * Map Oxfmt-like `customGroups` onto `import/order` `pathGroups`.
 *
 * Custom group names are not first-class in `import/order`; each entry must
 * attach to a real group via `group` / `position` (defaults: `external` /
 * `before`), matching the common “react before other externals” pattern.
 */
export function customGroupsToPathGroups(
  customGroups: SortImportsCustomGroup[],
): Exclude<ImportOrderConfig['pathGroups'], undefined> {
  return customGroups.flatMap((entry) => {
    const group = entry.group ?? 'external';
    const position = entry.position ?? 'before';
    return toPatterns(entry.elementNamePattern).map((pattern) => ({
      pattern,
      group,
      position,
    }));
  });
}

/**
 * Translate Oxfmt-shaped `sortImports` options into `import/order` options +
 * settings. Options that cannot be honored (per-group `newlinesBetween`
 * markers, `partitionByComment`, perfectionist modifier-selectors, etc.) are
 * intentionally omitted — see README.
 */
export function resolveSortImports(options: true | SortImportsOptions = true): {
  rule: ImportOrderConfig;
  settings: Record<string, unknown>;
} {
  const opts = options === true ? {} : options;

  const {
    groups = DEFAULT_SORT_IMPORT_GROUPS,
    newlinesBetween = true,
    customGroups = [],
    internalPattern = DEFAULT_INTERNAL_PATTERN,
    order = 'asc',
    ignoreCase = true,
    named = true,
    sortSideEffects = false,
  } = opts;

  const pathGroups = customGroupsToPathGroups(customGroups);

  // Drop unknown custom names mistakenly placed in `groups` — `import/order`
  // only accepts its predefined set.
  const normalizedGroups = groups
    .map((item) => {
      if (Array.isArray(item)) {
        const filtered = item.filter((g): g is ImportOrderGroup =>
          PREDEFINED_GROUPS.has(g),
        );
        return filtered.length > 0 ? filtered : null;
      }
      return PREDEFINED_GROUPS.has(item) ? item : null;
    })
    .filter((item): item is ImportOrderGroup | ImportOrderGroup[] =>
      Boolean(item),
    );

  const rule: ImportOrderConfig = {
    groups:
      normalizedGroups.length > 0
        ? normalizedGroups
        : DEFAULT_SORT_IMPORT_GROUPS,
    'newlines-between': newlinesBetween ? 'always' : 'never',
    alphabetize: {
      order,
      caseInsensitive: ignoreCase,
    },
    named,
    warnOnUnassignedImports: sortSideEffects,
    ...(pathGroups.length > 0
      ? {
          pathGroups,
          // Allow pathGroups to rematch scoped / package imports (Oxfmt customGroups).
          pathGroupsExcludedImportTypes: ['builtin', 'object'],
        }
      : {}),
  };

  const settings: Record<string, unknown> = {};
  const internalRegex = internalPatternToRegex(internalPattern);
  if (internalRegex) {
    settings['import/internal-regex'] = internalRegex;
  }

  return { rule, settings };
}
