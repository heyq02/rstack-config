export const GLOB_SRC_EXT = '?([cm])[jt]s?(x)';
export const GLOB_SRC = `**/*.${GLOB_SRC_EXT}`;

export const GLOB_JS = '**/*.?([cm])js';
export const GLOB_JSX = '**/*.jsx';

export const GLOB_TS = '**/*.?([cm])ts';
export const GLOB_TSX = '**/*.tsx';

export const GLOB_TESTS = [
  `**/__tests__/**/*.${GLOB_SRC_EXT}`,
  `**/*.spec.${GLOB_SRC_EXT}`,
  `**/*.test.${GLOB_SRC_EXT}`,
  `**/*.bench.${GLOB_SRC_EXT}`,
  `**/*.benchmark.${GLOB_SRC_EXT}`,
] as const;

export const GLOB_NODE_MODULES = '**/node_modules' as const;
export const GLOB_DIST = '**/dist' as const;
export const GLOB_LOCKFILE: string[] = [
  '**/package-lock.json',
  '**/yarn.lock',
  '**/pnpm-lock.yaml',
  '**/bun.lock',
  '**/bun.lockb',
];

export const GLOB_EXCLUDE: string[] = [
  GLOB_NODE_MODULES,
  GLOB_DIST,
  ...GLOB_LOCKFILE,

  '**/coverage',
  '**/temp',
  '**/tmp',
  '**/fixtures',
  '**/output',
  '**/.vitepress/cache',
  '**/.nuxt',
  '**/.next',
  '**/.vercel',
  '**/.changeset',
  '**/.idea',
  '**/.output',
  '**/.vite-inspect',
  '**/.nitro',
  '**/.turbo',
  '**/CHANGELOG*.md',
  '**/*.min.*',
  '**/LICENSE*',
  '**/__snapshots__',
  '**/auto-import?(s).d.ts',
  '**/components.d.ts',
];
