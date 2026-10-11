import { expect, test } from 'rstack/test';
import { fmt } from '../src/fmt/index.ts';

test('fmt() returns prettier-compatible defaults', () => {
  expect(fmt()).toEqual({
    semi: true,
    singleQuote: true,
    trailingComma: 'all',
    sortPackageJson: true,
    ignorePatterns: ['.github/**'],
  });
});

test('fmt() allows overrides', () => {
  expect(fmt({ printWidth: 100, ignorePatterns: [] })).toMatchObject({
    printWidth: 100,
    ignorePatterns: [],
    singleQuote: true,
  });
});
