import {
  deMorgan,
  eslintComments,
  ignores,
  imports,
  javascript,
  jest,
  jsxA11y,
  node,
  promise,
  react,
  regexp,
  rstest,
  specialCases,
  typescript,
  unicorn,
  unusedImports,
} from './configs/index.ts';
import {
  hasJest,
  hasReact,
  hasRstest,
  hasTypeScript,
  isInEditorEnv,
} from './env.ts';
import type {
  Options,
  ResolvableConfig,
  TypeScriptOptions,
  TypedFlatConfig,
} from './types.ts';
import { flattenConfigs } from './utils.ts';

/** Ignore common files and include JavaScript support. */
export const presetJavaScript = (): TypedFlatConfig[] => [
  ...ignores(),
  ...javascript(),
  ...imports({ typescript: false, sortImports: true }),
  ...unicorn(),
  ...node(),
  ...promise(),
  ...unusedImports({ isInEditor: isInEditorEnv() }),
  ...regexp(),
  ...deMorgan(),
  ...eslintComments(),
];

/** Includes `presetJavaScript` and TypeScript support. */
export const presetBasic = (
  typescriptOptions: true | TypeScriptOptions = true,
): TypedFlatConfig[] => [
  ...ignores(),
  ...javascript(),
  ...typescript(typescriptOptions),
  ...imports({ typescript: true, sortImports: true }),
  ...unicorn(),
  ...node(),
  ...promise(),
  ...unusedImports({ isInEditor: isInEditorEnv() }),
  ...regexp(),
  ...deMorgan(),
  ...eslintComments(),
];

/**
 * Full opinionated preset:
 * - JS + TS
 * - Unicorn / import / node / promise
 * - React / Jest / Rstest / jsx-a11y forced on
 * - Special-case overrides
 */
export const presetAll = (): TypedFlatConfig[] =>
  lint({
    typescript: true,
    react: true,
    jest: true,
    rstest: true,
    jsxA11y: true,
  });

/**
 * Opinionated Rslint flat-config factory for `@heyq02/rstack-config/rslint`.
 *
 * @example
 * ```ts
 * import { lint } from '@heyq02/rstack-config/rslint'
 *
 * export default lint({
 *   typescript: { typeChecked: true, strict: true },
 *   react: true,
 * })
 * ```
 */
export function lint(
  options: Options = {},
  ...userConfigs: ResolvableConfig[]
): TypedFlatConfig[] {
  const {
    ignores: extraIgnores = [],
    isInEditor = isInEditorEnv(),
    javascript: enableJavaScript = true,
    typescript: enableTypeScript = hasTypeScript(),
    unicorn: enableUnicorn = true,
    imports: enableImports = true,
    sortImports: sortImportsOption = true,
    node: enableNode = true,
    promise: enablePromise = true,
    react: enableReact = hasReact(),
    jsxA11y: enableJsxA11y,
    jest: enableJest = hasJest(),
    rstest: enableRstest = hasRstest(),
    unusedImports: enableUnusedImports = true,
    regexp: enableRegexp = true,
    deMorgan: enableDeMorgan = true,
    eslintComments: enableEslintComments = true,
  } = options;

  const configs: TypedFlatConfig[] = [...ignores(extraIgnores)];

  if (enableJavaScript) {
    configs.push(...javascript());
  }

  if (enableTypeScript) {
    configs.push(
      ...typescript(enableTypeScript === true ? true : enableTypeScript),
    );
  }

  if (enableImports) {
    configs.push(
      ...imports({
        typescript: Boolean(enableTypeScript),
        sortImports: sortImportsOption,
      }),
    );
  }

  if (enableUnicorn) {
    configs.push(...unicorn());
  }

  if (enableNode) {
    configs.push(...node(enableNode === true ? 'module' : enableNode));
  }

  if (enablePromise) {
    configs.push(...promise());
  }

  if (enableReact) {
    configs.push(
      ...react({
        jsxA11y: enableJsxA11y ?? true,
      }),
    );
  } else if (enableJsxA11y) {
    configs.push(...jsxA11y());
  }

  if (enableJest) {
    configs.push(...jest());
  }

  if (enableRstest) {
    configs.push(...rstest());
  }

  if (enableUnusedImports) {
    configs.push(...unusedImports({ isInEditor }));
  }

  if (enableRegexp) {
    configs.push(...regexp());
  }

  if (enableDeMorgan) {
    configs.push(...deMorgan());
  }

  if (enableEslintComments) {
    configs.push(...eslintComments());
  }

  configs.push(...specialCases());
  configs.push(...flattenConfigs(...userConfigs));

  return configs;
}

/** Alias of {@link lint}. */
export const rslintConfig = lint;
