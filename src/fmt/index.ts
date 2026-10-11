/**
 * Options for `rs fmt` / `define.fmt()`.
 * Compatible with Prettier options plus Rstack builtins.
 */
export interface FmtOverride {
  files: string | string[];
  excludeFiles?: string | string[];
  options?: Record<string, unknown>;
}

export interface FmtOptions {
  /** @default true */
  semi?: boolean;
  /** @default true */
  singleQuote?: boolean;
  trailingComma?: 'none' | 'es5' | 'all';
  printWidth?: number;
  tabWidth?: number;
  useTabs?: boolean;
  /**
   * Sort `package.json` fields using `sort-package-json`.
   * @default true
   */
  sortPackageJson?: boolean;
  /**
   * Gitignore-compatible patterns relative to the Rstack config root.
   * Default includes `.github/**`.
   */
  ignorePatterns?: string[];
  plugins?: (string | URL)[];
  overrides?: FmtOverride[];
  [key: string]: unknown;
}

const DEFAULT_IGNORE = ['.github/**'] as const;

/**
 * Opinionated formatting preset for `define.fmt()` / `rs fmt`.
 * Analogous to [`@sxzz/prettier-config`](https://github.com/sxzz/prettier-config).
 */
export function fmt({
  semi = true,
  singleQuote = true,
  trailingComma = 'all',
  sortPackageJson = true,
  ignorePatterns = [...DEFAULT_IGNORE],
  ...rest
}: FmtOptions = {}): FmtOptions {
  return {
    semi,
    singleQuote,
    trailingComma,
    sortPackageJson,
    ignorePatterns,
    ...rest,
  };
}
