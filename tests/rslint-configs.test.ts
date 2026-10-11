import { nodePlugin, ts } from '@rslint/core';
import { describe, expect, it } from 'rstack/test';
import { imports } from '../src/rslint/configs/imports.ts';
import { jest } from '../src/rslint/configs/jest.ts';
import { node } from '../src/rslint/configs/node.ts';
import { jsxA11y, react } from '../src/rslint/configs/react.ts';
import { rstest } from '../src/rslint/configs/rstest.ts';
import { typescript } from '../src/rslint/configs/typescript.ts';
import type { TypedFlatConfig } from '../src/rslint/types.ts';

function containsEntries(
  configs: TypedFlatConfig[],
  entries: TypedFlatConfig[],
): void {
  for (const entry of entries) {
    expect(configs).toContain(entry);
  }
}

function hasRule(configs: TypedFlatConfig[], rule: string): boolean {
  return configs.some((config) => config.rules?.[rule] !== undefined);
}

function projectServiceOf(configs: TypedFlatConfig[]): boolean | undefined {
  const entry = configs.find((config) => config.name === 'rstack/typescript');
  return entry?.languageOptions?.parserOptions?.projectService;
}

describe('typescript', () => {
  it('uses recommended and stylistic presets when enabled with true', () => {
    const configs = typescript(true);
    containsEntries(configs, ts.configs.recommended);
    containsEntries(configs, ts.configs.stylistic);
    expect(hasRule(configs, '@typescript-eslint/no-dynamic-delete')).toBe(
      false,
    );
    expect(hasRule(configs, '@typescript-eslint/array-type')).toBe(true);
    expect(projectServiceOf(configs)).toBeUndefined();
  });

  it('fills omitted object options from the same defaults', () => {
    const configs = typescript({});
    containsEntries(configs, ts.configs.recommended);
    containsEntries(configs, ts.configs.stylistic);
    expect(projectServiceOf(configs)).toBeUndefined();
  });

  it('uses the strict preset without type-aware rules', () => {
    const configs = typescript({
      strict: true,
      typeChecked: false,
      stylistic: true,
    });
    containsEntries(configs, ts.configs.strict);
    containsEntries(configs, ts.configs.stylistic);
    expect(hasRule(configs, '@typescript-eslint/no-dynamic-delete')).toBe(true);
    expect(hasRule(configs, '@typescript-eslint/await-thenable')).toBe(false);
    expect(projectServiceOf(configs)).toBeUndefined();
  });

  it('uses strict type-checked presets and enables project service', () => {
    const configs = typescript({ strict: true, typeChecked: true });
    containsEntries(configs, ts.configs.strictTypeChecked);
    containsEntries(configs, ts.configs.stylisticTypeChecked);
    expect(hasRule(configs, '@typescript-eslint/no-dynamic-delete')).toBe(true);
    expect(hasRule(configs, '@typescript-eslint/await-thenable')).toBe(true);
    expect(hasRule(configs, '@typescript-eslint/dot-notation')).toBe(true);
    expect(projectServiceOf(configs)).toBe(true);
  });

  it('uses recommended type-checked presets when strict is off', () => {
    const configs = typescript({
      typeChecked: true,
      strict: false,
      stylistic: true,
    });
    containsEntries(configs, ts.configs.recommendedTypeChecked);
    containsEntries(configs, ts.configs.stylisticTypeChecked);
    expect(hasRule(configs, '@typescript-eslint/no-dynamic-delete')).toBe(
      false,
    );
    expect(hasRule(configs, '@typescript-eslint/await-thenable')).toBe(true);
    expect(projectServiceOf(configs)).toBe(true);
  });

  it('skips stylistic presets when stylistic is false', () => {
    const plain = typescript({ stylistic: false });
    containsEntries(plain, ts.configs.recommended);
    expect(hasRule(plain, '@typescript-eslint/array-type')).toBe(false);

    const checked = typescript({ typeChecked: true, stylistic: false });
    containsEntries(checked, ts.configs.recommendedTypeChecked);
    expect(hasRule(checked, '@typescript-eslint/dot-notation')).toBe(false);
    expect(projectServiceOf(checked)).toBe(true);
  });

  it('honors an explicit projectService flag', () => {
    expect(projectServiceOf(typescript({ projectService: false }))).toBe(false);
    expect(
      projectServiceOf(
        typescript({ typeChecked: true, projectService: false }),
      ),
    ).toBe(false);
    expect(
      projectServiceOf(
        typescript({ typeChecked: false, projectService: true }),
      ),
    ).toBe(true);
  });
});

describe('node', () => {
  it('names mixed recommended entries and keeps upstream names', () => {
    const original = Object.getOwnPropertyDescriptor(
      nodePlugin.configs,
      'recommended',
    );
    Object.defineProperty(nodePlugin.configs, 'recommended', {
      configurable: true,
      get: () => [{ name: 'upstream/node', rules: {} }, { rules: {} }],
    });

    try {
      const configs = node('mixed');
      expect(configs.map((config) => config.name)).toEqual([
        'upstream/node',
        'rstack/node/recommended-1',
      ]);
    } finally {
      if (original)
        Object.defineProperty(nodePlugin.configs, 'recommended', original);
    }
  });

  it('uses the script preset', () => {
    expect(node('script').map((config) => config.name)).toEqual([
      'rstack/node/recommended-script',
    ]);
  });
});

describe('react', () => {
  it('includes jsx-a11y unless it is turned off', () => {
    expect(
      react().some((config) => config.name === 'rstack/jsx-a11y/recommended'),
    ).toBe(true);
    expect(
      react({ jsxA11y: false }).some(
        (config) => config.name === 'rstack/jsx-a11y/recommended',
      ),
    ).toBe(false);
    expect(jsxA11y()[0]?.name).toBe('rstack/jsx-a11y/recommended');
  });
});

describe('jest and rstest', () => {
  it('exposes the Jest recommended and style layers', () => {
    expect(jest().map((config) => config.name)).toEqual([
      'rstack/jest/recommended',
      'rstack/jest/style',
    ]);
  });

  it('exposes the Rstest recommended layer', () => {
    expect(rstest().map((config) => config.name)).toEqual([
      'rstack/rstest/recommended',
    ]);
  });
});

describe('imports', () => {
  it('omits settings when internal patterns produce no regex', () => {
    const sort = imports({ sortImports: { internalPattern: [] } }).find(
      (config) => config.name === 'rstack/imports/sort',
    );
    expect(sort?.settings).toBeUndefined();
    expect(sort?.rules?.['import/order']).toBeDefined();
  });
});
