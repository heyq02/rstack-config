import { describe, expect, it } from 'rstack/test';
import {
  heyq02,
  presetAll,
  presetBasic,
  presetJavaScript,
  rslintConfig,
} from '../src/rslint/presets.ts';

function names(configs: { name?: string }[]): string[] {
  return configs.map((c) => c.name).filter((n): n is string => Boolean(n));
}

describe('heyq02', () => {
  it('includes core layers when features are forced on', () => {
    const configNames = names(
      heyq02({
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

    expect(configNames).toContain('heyq02/js');
    expect(configNames).toContain('heyq02/imports');
    expect(configNames).toContain('heyq02/imports/sort');
    expect(configNames).toContain('heyq02/unused-imports');
    expect(configNames).toContain('heyq02/regexp');
    expect(configNames).toContain('heyq02/de-morgan');
    expect(configNames).toContain('heyq02/eslint-comments');
    expect(configNames).toContain('heyq02/special/cli');
  });

  it('honors feature toggles and appends user configs', () => {
    const configs = heyq02(
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
    expect(configNames).toContain('heyq02/js');
    expect(configNames).not.toContain('heyq02/imports');
    expect(configNames).not.toContain('heyq02/imports/sort');
    expect(configNames).not.toContain('heyq02/unused-imports');
    expect(configNames).toContain('user/override');
  });

  it('disables import sorting when sortImports is false', () => {
    const configNames = names(
      heyq02({
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

    expect(configNames).toContain('heyq02/imports');
    expect(configNames).not.toContain('heyq02/imports/sort');
  });

  it('can turn JavaScript off and pass TypeScript, Node, and React options through', () => {
    const configs = heyq02({
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

    expect(configNames).not.toContain('heyq02/js');
    expect(configNames).toContain('heyq02/typescript');
    expect(configNames).toContain('heyq02/node/recommended-script');
    expect(configNames).toContain('heyq02/react/recommended');
    expect(configNames).not.toContain('heyq02/jsx-a11y/recommended');
    expect(configNames).toContain('heyq02/jest/recommended');
    expect(configNames).toContain('heyq02/rstest/recommended');

    const typescriptEntry = configs.find(
      (config) => config.name === 'heyq02/typescript',
    );
    expect(
      typescriptEntry?.languageOptions?.parserOptions?.projectService,
    ).toBe(false);
  });

  it('enables jsx-a11y with React by default and without React when asked', () => {
    const withReact = names(
      heyq02({
        typescript: false,
        jest: false,
        rstest: false,
        react: true,
      }),
    );
    expect(withReact).toContain('heyq02/jsx-a11y/recommended');

    const a11yOnly = names(
      heyq02({
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
    expect(a11yOnly).toContain('heyq02/jsx-a11y/recommended');
    expect(a11yOnly).not.toContain('heyq02/react/recommended');
    expect(
      a11yOnly.some((name) => name.startsWith('heyq02/node/recommended-')),
    ).toBe(true);
  });

  it('softens unused-import rules when isInEditor is true', () => {
    const entry = heyq02({
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
    }).find((c) => c.name === 'heyq02/unused-imports');

    expect(entry?.rules?.['unused-imports/no-unused-imports']).toBe('off');
    expect(entry?.rules?.['unused-imports/no-unused-vars']).toBe('off');
  });
});

describe('presets', () => {
  it('presetJavaScript exposes the JS baseline names', () => {
    const configNames = names(presetJavaScript());
    expect(configNames).toContain('heyq02/js');
    expect(configNames).toContain('heyq02/imports');
    expect(configNames).not.toContain('heyq02/typescript');
  });

  it('presetBasic layers TypeScript configs', () => {
    const configNames = names(presetBasic(true));
    expect(configNames.some((n) => n.includes('typescript'))).toBe(true);
    expect(configNames).toContain('heyq02/imports/sort');
  });

  it('presetBasic forwards TypeScript option objects', () => {
    const typescriptEntry = presetBasic({
      typeChecked: true,
      projectService: true,
    }).find((config) => config.name === 'heyq02/typescript');
    expect(
      typescriptEntry?.languageOptions?.parserOptions?.projectService,
    ).toBe(true);
  });

  it('presetAll forces React, Jest, Rstest, and jsx-a11y on', () => {
    const configNames = names(presetAll());
    expect(configNames).toContain('heyq02/react/recommended');
    expect(configNames).toContain('heyq02/react-hooks/recommended');
    expect(configNames).toContain('heyq02/jsx-a11y/recommended');
    expect(configNames).toContain('heyq02/jest/style');
    expect(configNames).toContain('heyq02/rstest/recommended');
  });

  it('rslintConfig aliases heyq02', () => {
    expect(rslintConfig).toBe(heyq02);
  });
});
