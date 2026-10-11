import { expect, test } from 'rstack/test';
import { staged } from '../src/staged/index.ts';

test('staged() formats all and lint-fixes JS/TS', () => {
  expect(staged()).toEqual({
    '*': 'rs fmt --no-error-on-unmatched-pattern --ignore-unknown',
    '*.{js,jsx,ts,tsx,mjs,cjs,mts,cts}': 'rs lint --fix',
  });
});

test('staged() can disable layers', () => {
  expect(staged({ formatAll: false, lintFix: false })).toEqual({});
  expect(staged({ formatAll: false })).toEqual({
    '*.{js,jsx,ts,tsx,mjs,cjs,mts,cts}': 'rs lint --fix',
  });
});
