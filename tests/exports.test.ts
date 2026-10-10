import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'rstack/test';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

describe('package exports', () => {
  it('exposes tree-shakeable rslint and rslib subpaths only', () => {
    const pkg = JSON.parse(
      readFileSync(join(root, 'package.json'), 'utf8'),
    ) as {
      name: string;
      sideEffects: boolean;
      exports: Record<string, unknown>;
      peerDependenciesMeta?: Record<string, { optional?: boolean }>;
    };

    expect(pkg.name).toBe('@heyq02/rstack-config');
    expect(pkg.sideEffects).toBe(false);
    expect(Object.keys(pkg.exports).sort()).toEqual([
      './package.json',
      './rslib',
      './rslint',
    ]);
    expect(pkg.exports['./rslint']).toEqual({
      types: './dist/rslint/index.d.ts',
      default: './dist/rslint/index.js',
    });
    expect(pkg.exports['./rslib']).toEqual({
      types: './dist/rslib/index.d.ts',
      default: './dist/rslib/index.js',
    });
    expect(pkg.exports['./package.json']).toBe('./package.json');
    expect('.' in pkg.exports).toBe(false);
    expect(pkg.peerDependenciesMeta?.['@rslint/core']?.optional).toBe(true);
    expect(pkg.peerDependenciesMeta?.['@rslib/core']?.optional).toBe(true);
  });
});
