import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'rstack/test';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

describe('tsconfig preset', () => {
  it('ships opinionated compilerOptions without path-relative include/rootDir', () => {
    const config = JSON.parse(
      readFileSync(join(root, 'tsconfigs/tsconfig.json'), 'utf8'),
    ) as {
      compilerOptions: Record<string, unknown>;
      include?: string[];
      rootDir?: string;
    };

    expect(existsSync(join(root, 'tsconfigs/tsconfig.json'))).toBe(true);
    expect(config.include).toBeUndefined();
    expect(config.compilerOptions.rootDir).toBeUndefined();
    expect(config.compilerOptions).toMatchObject({
      target: 'ES2022',
      moduleResolution: 'bundler',
      strict: true,
      noEmit: true,
      types: ['node'],
      allowImportingTsExtensions: true,
      verbatimModuleSyntax: true,
    });
  });

  it('self-hosts via relative extends and local include/rootDir', () => {
    const rootConfig = JSON.parse(
      readFileSync(join(root, 'tsconfig.json'), 'utf8'),
    ) as {
      extends: string;
      compilerOptions: { rootDir: string };
      include: string[];
    };

    expect(rootConfig.extends).toBe('./tsconfigs/tsconfig.json');
    expect(rootConfig.compilerOptions.rootDir).toBe('src');
    expect(rootConfig.include).toEqual(['src']);
  });

  it('publishes tsconfigs/ alongside dist', () => {
    const pkg = JSON.parse(
      readFileSync(join(root, 'package.json'), 'utf8'),
    ) as { files: string[] };

    expect(pkg.files).toEqual(expect.arrayContaining(['dist', 'tsconfigs']));
  });
});
