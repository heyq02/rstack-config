import { isPackageExists } from 'local-pkg';
import process from 'node:process';

export const hasTypeScript = (): boolean => isPackageExists('typescript');

export const hasReact = (): boolean =>
  isPackageExists('react') ||
  isPackageExists('react-dom') ||
  isPackageExists('next') ||
  isPackageExists('preact') ||
  isPackageExists('@remix-run/react');

export const hasJest = (): boolean =>
  isPackageExists('jest') || isPackageExists('@jest/globals');

export const hasRstest = (): boolean =>
  isPackageExists('rstest') ||
  isPackageExists('@rstest/core') ||
  isPackageExists('@rstest/adapter');

export function isInEditorEnv(): boolean {
  if (process.env.CI) return false;
  if (isInGitHooksOrLintStaged()) return false;
  return !!(
    process.env.VSCODE_PID ||
    process.env.VSCODE_CWD ||
    process.env.JETBRAINS_IDE ||
    process.env.VIM ||
    process.env.NVIM
  );
}

export function isInGitHooksOrLintStaged(): boolean {
  return !!(
    process.env.GIT_PARAMS ||
    process.env.VSCODE_GIT_COMMAND ||
    process.env.npm_lifecycle_script?.startsWith('lint-staged')
  );
}
