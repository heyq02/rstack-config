import { expect, test } from 'rstack/test';
import { test as testPreset } from '../src/test/index.ts';

test('test() sets node library defaults', () => {
  const config = testPreset();

  expect(config.extends).toEqual({});
  expect(config.testEnvironment).toBe('node');
  expect(config.include).toEqual(['tests/**/*.test.ts']);
  expect(config.coverage).toMatchObject({
    provider: 'v8',
    thresholds: {
      statements: 100,
      branches: 100,
      functions: 100,
      lines: 100,
    },
  });
});

test('test() can disable strict coverage', () => {
  expect(testPreset({ strictCoverage: false }).coverage).not.toHaveProperty(
    'thresholds',
  );
});
