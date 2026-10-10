import { describe, expect, it } from 'rstack/test';
import { flattenConfigs, toArray } from '../src/rslint/utils.ts';

describe('toArray', () => {
  it('wraps scalars and keeps arrays', () => {
    expect(toArray(1)).toEqual([1]);
    expect(toArray([1, 2])).toEqual([1, 2]);
  });
});

describe('flattenConfigs', () => {
  it('flattens nested configs and drops falsy values', () => {
    expect(
      flattenConfigs(
        { name: 'a' },
        [{ name: 'b' }, { name: 'c' }],
        false,
        null,
        undefined,
        {
          name: 'd',
        },
      ),
    ).toEqual([{ name: 'a' }, { name: 'b' }, { name: 'c' }, { name: 'd' }]);
  });
});
