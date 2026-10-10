import { afterEach, describe, expect, it, rs } from 'rstack/test';

rs.mock('local-pkg', () => ({
  isPackageExists: rs.fn(() => false),
}));

import { isPackageExists } from 'local-pkg';
import {
  hasJest,
  hasReact,
  hasRstest,
  hasTypeScript,
  isInEditorEnv,
  isInGitHooksOrLintStaged,
} from '../src/rslint/env.ts';

const packageExists = rs.mocked(isPackageExists);

const keys = [
  'CI',
  'VSCODE_PID',
  'VSCODE_CWD',
  'JETBRAINS_IDE',
  'VIM',
  'NVIM',
  'GIT_PARAMS',
  'VSCODE_GIT_COMMAND',
  'npm_lifecycle_script',
] as const;

const snapshot = Object.fromEntries(keys.map((key) => [key, process.env[key]]));

afterEach(() => {
  for (const key of keys) {
    const value = snapshot[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe('isInGitHooksOrLintStaged', () => {
  it('detects lint-staged / git hook env markers', () => {
    delete process.env.GIT_PARAMS;
    delete process.env.VSCODE_GIT_COMMAND;
    process.env.npm_lifecycle_script = 'lint-staged';
    expect(isInGitHooksOrLintStaged()).toBe(true);
  });

  it('detects git and VS Code git markers on their own', () => {
    delete process.env.npm_lifecycle_script;
    delete process.env.VSCODE_GIT_COMMAND;
    process.env.GIT_PARAMS = '1';
    expect(isInGitHooksOrLintStaged()).toBe(true);

    delete process.env.GIT_PARAMS;
    process.env.VSCODE_GIT_COMMAND = 'commit';
    expect(isInGitHooksOrLintStaged()).toBe(true);
  });

  it('ignores lifecycle scripts that are not lint-staged', () => {
    delete process.env.GIT_PARAMS;
    delete process.env.VSCODE_GIT_COMMAND;
    process.env.npm_lifecycle_script = 'rs test --coverage';
    expect(isInGitHooksOrLintStaged()).toBe(false);
  });
});

describe('isInEditorEnv', () => {
  it('is false under CI even when editor env is present', () => {
    process.env.CI = '1';
    process.env.VSCODE_PID = '1';
    expect(isInEditorEnv()).toBe(false);
  });

  it('is true when an editor marker is set outside CI/hooks', () => {
    delete process.env.CI;
    delete process.env.GIT_PARAMS;
    delete process.env.VSCODE_GIT_COMMAND;
    delete process.env.npm_lifecycle_script;
    process.env.VSCODE_PID = '123';
    expect(isInEditorEnv()).toBe(true);
  });

  it('is false in git hooks even when an editor is open', () => {
    delete process.env.CI;
    delete process.env.VSCODE_GIT_COMMAND;
    delete process.env.npm_lifecycle_script;
    process.env.GIT_PARAMS = '1';
    process.env.VSCODE_PID = '123';
    expect(isInEditorEnv()).toBe(false);
  });

  it.each(['VSCODE_CWD', 'JETBRAINS_IDE', 'VIM', 'NVIM'] as const)(
    'detects %s',
    (key) => {
      delete process.env.CI;
      delete process.env.GIT_PARAMS;
      delete process.env.VSCODE_GIT_COMMAND;
      delete process.env.npm_lifecycle_script;
      for (const name of [
        'VSCODE_PID',
        'VSCODE_CWD',
        'JETBRAINS_IDE',
        'VIM',
        'NVIM',
      ]) {
        delete process.env[name];
      }
      process.env[key] = '1';
      expect(isInEditorEnv()).toBe(true);
    },
  );

  it('is false when no editor, CI, or hook marker is set', () => {
    delete process.env.CI;
    delete process.env.GIT_PARAMS;
    delete process.env.VSCODE_GIT_COMMAND;
    delete process.env.npm_lifecycle_script;
    for (const name of [
      'VSCODE_PID',
      'VSCODE_CWD',
      'JETBRAINS_IDE',
      'VIM',
      'NVIM',
    ]) {
      delete process.env[name];
    }
    expect(isInEditorEnv()).toBe(false);
  });
});

describe('package detection', () => {
  afterEach(() => {
    packageExists.mockReset();
    packageExists.mockReturnValue(false);
  });

  it('reports each detected package and the all-missing case', () => {
    packageExists.mockReturnValue(true);
    expect(hasTypeScript()).toBe(true);
    packageExists.mockReturnValue(false);
    expect(hasTypeScript()).toBe(false);

    for (const name of [
      'react',
      'react-dom',
      'next',
      'preact',
      '@remix-run/react',
    ]) {
      packageExists.mockImplementation((pkg) => pkg === name);
      expect(hasReact()).toBe(true);
    }
    packageExists.mockReturnValue(false);
    expect(hasReact()).toBe(false);

    for (const name of ['jest', '@jest/globals']) {
      packageExists.mockImplementation((pkg) => pkg === name);
      expect(hasJest()).toBe(true);
    }
    packageExists.mockReturnValue(false);
    expect(hasJest()).toBe(false);

    for (const name of ['rstest', '@rstest/core', '@rstest/adapter']) {
      packageExists.mockImplementation((pkg) => pkg === name);
      expect(hasRstest()).toBe(true);
    }
    packageExists.mockReturnValue(false);
    expect(hasRstest()).toBe(false);
  });
});
