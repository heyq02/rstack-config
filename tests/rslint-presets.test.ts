import { describe, expect, it } from 'rstack/test';
import {
  lint,
  presetAll,
  presetBasic,
  presetJavaScript,
  rslintConfig,
} from '../src/rslint/presets.ts';

function names(configs: { name?: string }[]): string[] {
  return configs.map((c) => c.name).filter((n): n is string => Boolean(n));
}

describe('lint', () => {
  it('includes core layers when features are forced on', () => {
    const configNames = names(
      lint({
        typescript: true,
        react: false,
        jest: false,
        rstest: false,
        unusedImports: true,
        regexp: true,
        deMorgan: true,
        eslintComments: true,
      }),
    );

    expect(configNames).toContain('rstack/js');
    expect(configNames).toContain('rstack/imports');
    expect(configNames).toContain('rstack/imports/sort');
    expect(configNames).toContain('rstack/unused-imports');
    expect(configNames).toContain('rstack/regexp');
    expect(configNames).toContain('rstack/de-morgan');
    expect(configNames).toContain('rstack/eslint-comments');
    expect(configNames).toContain('rstack/special/cli');
  });

  it('honors feature toggles and appends user configs', () => {
    const configs = lint(
      {
        typescript: false,
        javascript: true,
        unicorn: false,
        imports: false,
        node: false,
        promise: false,
        react: false,
        jest: false,
        rstest: false,
        unusedImports: false,
        regexp: false,
        deMorgan: false,
        eslintComments: false,
      },
      { name: 'user/override', rules: { 'no-console': 'off' } },
    );

    const configNames = names(configs);
    expect(configNames).toContain('rstack/js');
    expect(configNames).not.toContain('rstack/imports');
    expect(configNames).not.toContain('rstack/imports/sort');
    expect(configNames).not.toContain('rstack/unused-imports');
    expect(configNames).toContain('user/override');
  });

  it('disables import sorting when sortImports is false', () => {
    const configNames = names(
      lint({
        typescript: false,
        react: false,
        jest: false,
        rstest: false,
        imports: true,
        sortImports: false,
        unusedImports: false,
        regexp: false,
        deMorgan: false,
        eslintComments: false,
        unicorn: false,
        node: false,
        promise: false,
      }),
    );

    expect(configNames).toContain('rstack/imports');
    expect(configNames).not.toContain('rstack/imports/sort');
  });

  it('can turn JavaScript off and pass TypeScript, Node, and React options through', () => {
    const configs = lint({
      javascript: false,
      typescript: {
        typeChecked: true,
        strict: true,
        stylistic: false,
        projectService: false,
      },
      react: true,
      jsxA11y: false,
      jest: true,
      rstest: true,
      node: 'script',
      unicorn: false,
      imports: false,
      promise: false,
      unusedImports: false,
      regexp: false,
      deMorgan: false,
      eslintComments: false,
    });
    const configNames = names(configs);

    expect(configNames).not.toContain('rstack/js');
    expect(configNames).toContain('rstack/typescript');
    expect(configNames).toContain('rstack/node/recommended-script');
    expect(configNames).toContain('rstack/react/recommended');
    expect(configNames).not.toContain('rstack/jsx-a11y/recommended');
    expect(configNames).toContain('rstack/jest/recommended');
    expect(configNames).toContain('rstack/rstest/recommended');

    const typescriptEntry = configs.find(
      (config) => config.name === 'rstack/typescript',
    );
    expect(
      typescriptEntry?.languageOptions?.parserOptions?.projectService,
    ).toBe(false);
  });

  it('enables jsx-a11y with React by default and without React when asked', () => {
    const withReact = names(
      lint({
        typescript: false,
        jest: false,
        rstest: false,
        react: true,
      }),
    );
    expect(withReact).toContain('rstack/jsx-a11y/recommended');

    const a11yOnly = names(
      lint({
        typescript: false,
        javascript: false,
        unicorn: false,
        imports: false,
        node: 'mixed',
        promise: false,
        react: false,
        jsxA11y: true,
        jest: false,
        rstest: false,
        unusedImports: false,
        regexp: false,
        deMorgan: false,
        eslintComments: false,
      }),
    );
    expect(a11yOnly).toContain('rstack/jsx-a11y/recommended');
    expect(a11yOnly).not.toContain('rstack/react/recommended');
    expect(
      a11yOnly.some((name) => name.startsWith('rstack/node/recommended-')),
    ).toBe(true);
  });

  it('softens unused-import rules when isInEditor is true', () => {
    const entry = lint({
      typescript: false,
      react: false,
      jest: false,
      rstest: false,
      unicorn: false,
      node: false,
      promise: false,
      imports: false,
      regexp: false,
      deMorgan: false,
      eslintComments: false,
      unusedImports: true,
      isInEditor: true,
    }).find((c) => c.name === 'rstack/unused-imports');

    expect(entry?.rules?.['unused-imports/no-unused-imports']).toBe('off');
    expect(entry?.rules?.['unused-imports/no-unused-vars']).toBe('off');
  });
});

describe('presets', () => {
  it('presetJavaScript exposes the JS baseline names', () => {
    const configNames = names(presetJavaScript());
    expect(configNames).toContain('rstack/js');
    expect(configNames).toContain('rstack/imports');
    expect(configNames).not.toContain('rstack/typescript');
  });

  it('presetBasic layers TypeScript configs', () => {
    const configNames = names(presetBasic(true));
    expect(configNames.some((n) => n.includes('typescript'))).toBe(true);
    expect(configNames).toContain('rstack/imports/sort');
  });

  it('presetBasic forwards TypeScript option objects', () => {
    const typescriptEntry = presetBasic({
      typeChecked: true,
      projectService: true,
    }).find((config) => config.name === 'rstack/typescript');
    expect(
      typescriptEntry?.languageOptions?.parserOptions?.projectService,
    ).toBe(true);
  });

  it('presetAll forces React, Jest, Rstest, and jsx-a11y on', () => {
    const configNames = names(presetAll());
    expect(configNames).toContain('rstack/react/recommended');
    expect(configNames).toContain('rstack/react-hooks/recommended');
    expect(configNames).toContain('rstack/jsx-a11y/recommended');
    expect(configNames).toContain('rstack/jest/style');
    expect(configNames).toContain('rstack/rstest/recommended');
  });

  it('rslintConfig aliases lint', () => {
    expect(rslintConfig).toBe(lint);
  });
});
