import { describe, expect, it } from 'rstack/test';
import {
  customGroupsToPathGroups,
  DEFAULT_INTERNAL_PATTERN,
  DEFAULT_SORT_IMPORT_GROUPS,
  internalPatternToRegex,
  resolveSortImports,
} from '../src/rslint/configs/sort-imports.ts';

describe('internalPatternToRegex', () => {
  it('escapes Oxfmt-style prefixes into an alternation', () => {
    expect(internalPatternToRegex(['~/', '@/', '#'])).toBe(
      String.raw`^(?:~/|@/|#)`,
    );
  });

  it('returns empty string for no patterns', () => {
    expect(internalPatternToRegex([])).toBe('');
    expect(internalPatternToRegex([''])).toBe('');
  });
});

describe('customGroupsToPathGroups', () => {
  it('maps element patterns onto import/order pathGroups defaults', () => {
    expect(
      customGroupsToPathGroups([
        {
          groupName: 'react-libs',
          elementNamePattern: ['react', 'react-**'],
        },
      ]),
    ).toEqual([
      { pattern: 'react', group: 'external', position: 'before' },
      { pattern: 'react-**', group: 'external', position: 'before' },
    ]);
  });
});

describe('resolveSortImports', () => {
  it('applies Oxfmt-inspired defaults', () => {
    const { rule, settings } = resolveSortImports(true);

    expect(rule.groups).toEqual(DEFAULT_SORT_IMPORT_GROUPS);
    expect(rule['newlines-between']).toBe('always');
    expect(rule.alphabetize).toEqual({ order: 'asc', caseInsensitive: true });
    expect(rule.named).toBe(true);
    expect(rule.warnOnUnassignedImports).toBe(false);
    expect(settings['import/internal-regex']).toBe(
      internalPatternToRegex(DEFAULT_INTERNAL_PATTERN),
    );
  });

  it('honors overrides and drops unknown group names', () => {
    const { rule, settings } = resolveSortImports({
      groups: ['type', 'not-a-real-group' as never, ['builtin', 'external']],
      newlinesBetween: false,
      order: 'desc',
      ignoreCase: false,
      named: false,
      sortSideEffects: true,
      internalPattern: ['@app/'],
      customGroups: [
        {
          elementNamePattern: 'lodash',
          group: 'external',
          position: 'after',
        },
      ],
    });

    expect(rule.groups).toEqual(['type', ['builtin', 'external']]);
    expect(rule['newlines-between']).toBe('never');
    expect(rule.alphabetize).toEqual({
      order: 'desc',
      caseInsensitive: false,
    });
    expect(rule.named).toBe(false);
    expect(rule.warnOnUnassignedImports).toBe(true);
    expect(rule.pathGroups).toEqual([
      { pattern: 'lodash', group: 'external', position: 'after' },
    ]);
    expect(settings['import/internal-regex']).toBe(String.raw`^(?:@app/)`);
  });

  it('falls back to default groups and skips internal regex when nothing matches', () => {
    const { rule, settings } = resolveSortImports({
      groups: ['not-a-real-group' as never, ['also-not' as never]],
      internalPattern: [],
    });

    expect(rule.groups).toEqual(DEFAULT_SORT_IMPORT_GROUPS);
    expect(settings).toEqual({});
  });
});
