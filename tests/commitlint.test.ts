import { describe, expect, it } from 'rstack/test';
import {
  COMMIT_TYPES,
  commitlint,
  default as defaultConfig,
} from '../src/commitlint/index.ts';

describe('commitlint()', () => {
  it('exports default config with conventional rules and opinionated overrides', () => {
    expect(defaultConfig.parserPreset).toBeTruthy();
    expect(defaultConfig.extends).toBeUndefined();
    expect(defaultConfig.rules?.['header-max-length']).toEqual([
      2,
      'always',
      100,
    ]);
    expect(defaultConfig.rules?.['type-enum']).toEqual([
      2,
      'always',
      [...COMMIT_TYPES],
    ]);
    expect(defaultConfig.rules?.['subject-empty']).toBeTruthy();
  });

  it('allows overriding header length, types, and extra rules', () => {
    const config = commitlint({
      headerMaxLength: 72,
      types: ['feat', 'fix'],
      rules: {
        'subject-case': [0],
      },
    });

    expect(config.rules?.['header-max-length']).toEqual([2, 'always', 72]);
    expect(config.rules?.['type-enum']).toEqual([2, 'always', ['feat', 'fix']]);
    expect(config.rules?.['subject-case']).toEqual([0]);
  });

  it('matches factory defaults when called with no options', () => {
    expect(commitlint()).toEqual(defaultConfig);
  });
});
