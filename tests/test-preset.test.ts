import { expect, test } from 'rstack/test';
import { nodeTest } from '../src/test/index.ts';

test('nodeTest() sets node library defaults', () => {
  const config = nodeTest();

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

test('nodeTest() can disable strict coverage', () => {
  expect(nodeTest({ strictCoverage: false }).coverage).not.toHaveProperty(
    'thresholds',
  );
});
