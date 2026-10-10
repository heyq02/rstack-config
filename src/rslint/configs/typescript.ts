import { ts } from '@rslint/core';
import { GLOB_JS, GLOB_TS, GLOB_TSX } from '../globs.ts';
import type { TypeScriptOptions, TypedFlatConfig } from '../types.ts';
import { restrictedSyntaxJs } from './javascript.ts';

function resolveTypeScriptOptions(
  options: true | TypeScriptOptions,
): Required<Pick<TypeScriptOptions, 'typeChecked' | 'strict' | 'stylistic'>> &
  Pick<TypeScriptOptions, 'projectService'> {
  if (options === true) {
    return { typeChecked: false, strict: false, stylistic: true };
  }
  return {
    typeChecked: options.typeChecked ?? false,
    strict: options.strict ?? false,
    stylistic: options.stylistic ?? true,
    projectService: options.projectService,
  };
}

export const typescript = (
  options: true | TypeScriptOptions = true,
): TypedFlatConfig[] => {
  const opts = resolveTypeScriptOptions(options);
  const baseline =
    opts.strict && opts.typeChecked
      ? ts.configs.strictTypeChecked
      : opts.strict
        ? ts.configs.strict
        : opts.typeChecked
          ? ts.configs.recommendedTypeChecked
          : ts.configs.recommended;

  const stylistic = opts.stylistic
    ? opts.typeChecked
      ? ts.configs.stylisticTypeChecked
      : ts.configs.stylistic
    : [];

  const enableProjectService =
    opts.projectService ?? (opts.typeChecked ? true : undefined);

  return [
    ...baseline,
    ...stylistic,
    {
      files: [GLOB_TS, GLOB_TSX],
      name: 'heyq02/typescript',
      ...(enableProjectService === undefined
        ? {}
        : {
            languageOptions: {
              parserOptions: {
                projectService: enableProjectService,
              },
            },
          }),
      rules: {
        '@typescript-eslint/ban-ts-comment': 'off',
        '@typescript-eslint/consistent-type-assertions': [
          'error',
          {
            assertionStyle: 'as',
            objectLiteralTypeAssertions: 'allow-as-parameter',
          },
        ],
        '@typescript-eslint/consistent-type-imports': [
          'error',
          { disallowTypeAnnotations: false, fixStyle: 'inline-type-imports' },
        ],
        '@typescript-eslint/method-signature-style': ['error', 'property'],
        '@typescript-eslint/no-empty-object-type': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-import-type-side-effects': 'error',
        '@typescript-eslint/no-non-null-assertion': 'off',
        '@typescript-eslint/no-redeclare': 'error',
        '@typescript-eslint/no-unused-expressions': [
          'error',
          {
            allowShortCircuit: true,
            allowTaggedTemplates: true,
            allowTernary: true,
          },
        ],
        '@typescript-eslint/no-unused-vars': [
          'error',
          {
            args: 'after-used',
            argsIgnorePattern: '^_',
            ignoreRestSiblings: true,
            varsIgnorePattern: '^_',
          },
        ],
        '@typescript-eslint/no-useless-constructor': 'error',
        '@typescript-eslint/prefer-as-const': 'warn',
        '@typescript-eslint/prefer-literal-enum-member': [
          'error',
          { allowBitwiseExpressions: true },
        ],
        'no-restricted-syntax': [
          'error',
          ...restrictedSyntaxJs,
          'TSEnumDeclaration[const=true]',
        ],
        'no-unused-vars': 'off',
      },
    },
    {
      files: ['**/*.d.ts'],
      name: 'heyq02/typescript/dts-rules',
      rules: {
        'import/no-duplicates': 'off',
        'no-restricted-syntax': 'off',
      },
    },
    {
      files: [GLOB_JS, '**/*.cjs'],
      name: 'heyq02/typescript/cjs-rules',
      rules: {
        '@typescript-eslint/no-require-imports': 'off',
      },
    },
  ];
};
