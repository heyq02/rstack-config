import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'rstack/test';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

describe('package exports', () => {
  it('exposes tree-shakeable tool and rstack subpaths only', () => {
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
      './commitlint',
      './fmt',
      './package.json',
      './rslib',
      './rslint',
      './rstack',
      './staged',
      './test',
      './tsconfig',
      './tsconfig.json',
    ]);
    expect('.' in pkg.exports).toBe(false);
    expect(pkg.exports['./tsconfig']).toBe('./tsconfigs/tsconfig.json');
    expect(pkg.exports['./tsconfig.json']).toBe('./tsconfigs/tsconfig.json');
    expect(pkg.peerDependenciesMeta?.['@commitlint/cli']?.optional).toBe(true);
    expect(pkg.peerDependenciesMeta?.['@rslint/core']?.optional).toBe(true);
    expect(pkg.peerDependenciesMeta?.['@rslib/core']?.optional).toBe(true);
    expect(pkg.peerDependenciesMeta?.rstack?.optional).toBe(true);
    expect(
      pkg.peerDependenciesMeta?.['@rsdoctor/rspack-plugin']?.optional,
    ).toBe(true);
  });
});
