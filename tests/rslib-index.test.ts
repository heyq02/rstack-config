import { describe, expect, test } from 'rstack/test';
import {
  ESM_ONLY_IGNORE_RESOLUTIONS,
  lib,
  nodeLib,
  resolveAttwOptions,
  resolveRsdoctorPlugin,
} from '../src/rslib/index.ts';

interface RspackTools {
  plugins?: unknown[];
}

interface RsdoctorPluginShape {
  name: string;
  isRsdoctorPlugin: boolean;
  options: {
    disableClientServer?: boolean;
    port?: number;
    output?: {
      mode?: string;
      reportDir?: string;
      options?: {
        type?: string[];
        htmlOptions?: { reportHtmlName?: string; writeDataJson?: boolean };
        jsonOptions?: { fileName?: string };
      };
    };
  };
}

function rspackPlugins(config: {
  tools?: {
    rspack?: RspackTools | RspackTools[] | ((...args: unknown[]) => unknown);
  };
}): unknown[] {
  const rspack = config.tools?.rspack;
  if (!rspack || typeof rspack === 'function') {
    return [];
  }

  const configs = Array.isArray(rspack) ? rspack : [rspack];
  return configs.flatMap((item) => item.plugins ?? []);
}

function rsdoctorPlugin(config: {
  tools?: {
    rspack?: RspackTools | RspackTools[] | ((...args: unknown[]) => unknown);
  };
}): RsdoctorPluginShape {
  const plugin = rspackPlugins(config).find(
    (item) =>
      !!item &&
      typeof item === 'object' &&
      'name' in item &&
      item.name === 'RsdoctorRspackPlugin',
  );

  if (!plugin || typeof plugin !== 'object') {
    throw new Error('RsdoctorRspackPlugin was not registered');
  }

  return plugin as RsdoctorPluginShape;
}

function withEnv(
  values: Record<string, string | undefined>,
  run: () => void,
): void {
  const previous = new Map<string, string | undefined>();

  for (const key of Object.keys(values)) {
    previous.set(key, process.env[key]);
    const next = values[key];
    if (next === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = next;
    }
  }

  try {
    run();
  } finally {
    for (const [key, value] of previous) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

function hasPlugin(config: ReturnType<typeof lib>, name: string): boolean {
  return (config.plugins ?? []).some(
    (plugin) =>
      !!plugin &&
      typeof plugin === 'object' &&
      'name' in plugin &&
      plugin.name === name,
  );
}

test('lib() returns ESM preset with dts and index entry', () => {
  const config = lib();

  expect(config.lib).toEqual([
    {
      format: 'esm',
      bundle: true,
      dts: true,
    },
  ]);
  expect(config.source).toEqual({
    entry: { index: 'src/index.ts' },
  });
  expect(config.output?.target).toBeUndefined();
  expect(hasPlugin(config, 'plugin-publint')).toBe(true);
  expect(hasPlugin(config, 'plugin-arethetypeswrong')).toBe(true);
});

test('lib() passes through a custom entry', () => {
  expect(lib({ entry: { index: 'src/custom.ts' } })).toMatchObject({
    lib: [{ bundle: true }],
    source: { entry: { index: 'src/custom.ts' } },
  });
});

test('lib() supports shallow and all entry presets', () => {
  expect(lib({ entry: 'shallow' })).toMatchObject({
    lib: [{ bundle: false }],
    source: { entry: { index: 'src/*' } },
  });

  expect(lib({ entry: 'all' })).toMatchObject({
    lib: [{ bundle: false }],
    source: { entry: { index: 'src/**' } },
  });
});

test('lib() maps inlineDeps to autoExternal.exclude', () => {
  const config = lib({ inlineDeps: ['lodash', /^@scope\//] });

  expect(config.output?.autoExternal).toEqual({
    exclude: ['lodash', /^@scope\//],
  });
});

test('lib() accepts overrides', () => {
  const config = lib({}, { syntax: 'es2021' });

  expect(config.syntax).toBe('es2021');
});

test('lib() can disable publint', () => {
  const config = lib({ publint: false });

  expect(hasPlugin(config, 'plugin-publint')).toBe(false);
  expect(hasPlugin(config, 'plugin-arethetypeswrong')).toBe(true);
});

test('lib() forwards publint options', () => {
  const config = lib({
    publint: {
      enable: Boolean(process.env.CI),
      throwOn: 'warning',
    },
  });

  expect(hasPlugin(config, 'plugin-publint')).toBe(true);
});

test('lib() can disable attw', () => {
  const config = lib({ attw: false });

  expect(hasPlugin(config, 'plugin-arethetypeswrong')).toBe(false);
  expect(hasPlugin(config, 'plugin-publint')).toBe(true);
});

test('lib() supports attw ci-only', () => {
  const previous = process.env.CI;
  delete process.env.CI;

  try {
    expect(hasPlugin(lib({ attw: 'ci-only' }), 'plugin-arethetypeswrong')).toBe(
      false,
    );

    process.env.CI = 'true';
    expect(hasPlugin(lib({ attw: 'ci-only' }), 'plugin-arethetypeswrong')).toBe(
      true,
    );
  } finally {
    if (previous === undefined) {
      delete process.env.CI;
    } else {
      process.env.CI = previous;
    }
  }
});

test('lib() forwards attw plugin options', () => {
  const config = lib({
    attw: {
      enable: true,
      areTheTypesWrongOptions: {
        ignoreRules: ['false-cjs'],
        ignoreResolutions: ['node10'],
      },
    },
  });

  expect(hasPlugin(config, 'plugin-arethetypeswrong')).toBe(true);
});

test('lib() disables attw when enable is false', () => {
  const config = lib({ attw: { enable: false } });

  // Plugin is still registered; official plugin honors `enable` at runtime.
  expect(hasPlugin(config, 'plugin-arethetypeswrong')).toBe(true);
});

test('nodeLib() sets output.target to node', () => {
  const config = nodeLib();

  expect(config.output?.target).toBe('node');
  expect(config.lib).toEqual([
    {
      format: 'esm',
      bundle: true,
      dts: true,
    },
  ]);
  expect(hasPlugin(config, 'plugin-publint')).toBe(true);
  expect(hasPlugin(config, 'plugin-arethetypeswrong')).toBe(true);
});

test('nodeLib() merges overrides without dropping target', () => {
  const config = nodeLib({}, { output: { minify: false } });

  expect(config.output?.target).toBe('node');
  expect(config.output?.minify).toBe(false);
});

describe('resolveAttwOptions', () => {
  test('defaults to ESM-only ignoreResolutions', () => {
    expect(resolveAttwOptions(true)).toEqual({
      areTheTypesWrongOptions: {
        ignoreResolutions: [...ESM_ONLY_IGNORE_RESOLUTIONS],
      },
    });
    expect(resolveAttwOptions()).toEqual(resolveAttwOptions(true));
  });

  test('returns false when disabled', () => {
    expect(resolveAttwOptions(false)).toBe(false);
  });

  test('maps ci-only to enabled only when CI is set', () => {
    const previous = process.env.CI;
    delete process.env.CI;

    try {
      expect(resolveAttwOptions('ci-only')).toBe(false);

      process.env.CI = '1';
      expect(resolveAttwOptions('ci-only')).toEqual({
        areTheTypesWrongOptions: {
          ignoreResolutions: [...ESM_ONLY_IGNORE_RESOLUTIONS],
        },
      });
    } finally {
      if (previous === undefined) {
        delete process.env.CI;
      } else {
        process.env.CI = previous;
      }
    }
  });

  test('merges object options over ESM-only defaults', () => {
    expect(
      resolveAttwOptions({
        enable: true,
        areTheTypesWrongOptions: {
          ignoreRules: ['false-cjs'],
          ignoreResolutions: ['bundler'],
          summary: false,
        },
      }),
    ).toEqual({
      enable: true,
      areTheTypesWrongOptions: {
        ignoreResolutions: ['bundler'],
        ignoreRules: ['false-cjs'],
        summary: false,
      },
    });
  });
});

test('lib() leaves Rsdoctor off unless RSDOCTOR=true', () => {
  withEnv({ RSDOCTOR: undefined, CI: undefined }, () => {
    expect(rspackPlugins(lib())).toEqual([]);
    expect(rspackPlugins(lib({ rsdoctor: true }))).toEqual([]);
    expect(rspackPlugins(lib({ rsdoctor: false }))).toEqual([]);
    expect(rspackPlugins(lib({ rsdoctor: 'ci-only' }))).toEqual([]);
    expect(resolveRsdoctorPlugin()).toBe(false);
  });

  withEnv({ RSDOCTOR: '1', CI: undefined }, () => {
    expect(rspackPlugins(lib({ rsdoctor: true }))).toEqual([]);
  });

  withEnv({ RSDOCTOR: 'true', CI: undefined }, () => {
    expect(rspackPlugins(lib({ rsdoctor: false }))).toEqual([]);
  });
});

test('lib() registers Rsdoctor and writes a local report when RSDOCTOR=true', () => {
  withEnv({ RSDOCTOR: 'true', CI: undefined }, () => {
    const plugin = rsdoctorPlugin(lib({ rsdoctor: true }));

    expect(plugin.name).toBe('RsdoctorRspackPlugin');
    expect(plugin.isRsdoctorPlugin).toBe(true);
    expect(plugin.options.disableClientServer).toBe(false);
    expect(plugin.options.output).toMatchObject({
      mode: 'normal',
      reportDir: '.rsdoctor',
    });
  });
});

test('lib() writes a brief CI report and skips the client server', () => {
  withEnv({ RSDOCTOR: 'true', CI: 'true' }, () => {
    const plugin = rsdoctorPlugin(lib({ rsdoctor: true }));

    // Rsdoctor forces this off when RSTEST=true, and on when CI is set.
    expect(plugin.options.disableClientServer).toBe(
      process.env.RSTEST === 'true' ? false : true,
    );
    expect(plugin.options.output).toMatchObject({
      mode: 'brief',
      reportDir: 'dist/.rsdoctor',
      options: {
        type: ['json'],
        jsonOptions: {
          fileName: 'rsdoctor-data.json',
        },
      },
    });
  });
});

test('rsdoctor ci-only follows CI and ignores RSDOCTOR', () => {
  withEnv({ RSDOCTOR: undefined, CI: undefined }, () => {
    expect(resolveRsdoctorPlugin('ci-only')).toBe(false);
  });

  withEnv({ RSDOCTOR: undefined, CI: 'true' }, () => {
    const plugin = rsdoctorPlugin(nodeLib({ rsdoctor: 'ci-only' }));

    expect(plugin.options.disableClientServer).toBe(
      process.env.RSTEST === 'true' ? false : true,
    );
    expect(plugin.options.output?.mode).toBe('brief');
    expect(nodeLib({ rsdoctor: 'ci-only' }).output?.target).toBe('node');
  });
});

test('rsdoctor object options merge over the report defaults', () => {
  withEnv({ RSDOCTOR: 'true', CI: undefined }, () => {
    const portOnly = rsdoctorPlugin(lib({ rsdoctor: { port: 4321 } }));
    expect(portOnly.options.port).toBe(4321);
    expect(portOnly.options.output).toMatchObject({
      mode: 'normal',
      reportDir: '.rsdoctor',
    });

    const html = rsdoctorPlugin(
      lib({
        rsdoctor: {
          output: {
            reportDir: 'out',
            options: {
              type: ['html'],
              htmlOptions: { reportHtmlName: 'a.html' },
            },
          },
        },
      }),
    );
    expect(html.options.output).toMatchObject({
      mode: 'brief',
      reportDir: 'out',
      options: {
        type: ['html'],
        htmlOptions: { reportHtmlName: 'a.html' },
      },
    });

    const localDir = rsdoctorPlugin(
      lib({
        rsdoctor: {
          output: {
            reportDir: 'local-out',
          },
        },
      }),
    );
    expect(localDir.options.output).toMatchObject({
      mode: 'normal',
      reportDir: 'local-out',
    });

    const normalDir = rsdoctorPlugin(
      lib({
        rsdoctor: {
          output: {
            mode: 'normal',
            reportDir: 'custom',
          },
        },
      }),
    );
    expect(normalDir.options.output).toMatchObject({
      mode: 'normal',
      reportDir: 'custom',
    });
  });

  withEnv({ RSDOCTOR: 'true', CI: 'true' }, () => {
    const kept = rsdoctorPlugin(
      lib({
        rsdoctor: {
          output: {
            reportDir: 'custom',
          },
        },
      }),
    );
    expect(kept.options.output).toMatchObject({
      mode: 'brief',
      reportDir: 'custom',
      options: {
        type: ['json'],
        jsonOptions: { fileName: 'rsdoctor-data.json' },
      },
    });

    const json = rsdoctorPlugin(
      lib({
        rsdoctor: {
          disableClientServer: false,
          output: {
            options: {
              type: ['json'],
              jsonOptions: { fileName: 'data.json' },
            },
          },
        },
      }),
    );
    expect(json.options.disableClientServer).toBe(false);
    expect(json.options.output?.mode).toBe('brief');
    expect(json.options.output?.reportDir).toBe('dist/.rsdoctor');
    expect(json.options.output?.options).toMatchObject({
      type: ['json'],
      jsonOptions: { fileName: 'data.json' },
    });
  });
});

test('lib() keeps caller rspack plugins beside Rsdoctor', () => {
  const marker = { name: 'marker', apply: () => undefined };

  withEnv({ RSDOCTOR: 'true', CI: undefined }, () => {
    const plugins = rspackPlugins(
      lib(
        { rsdoctor: true },
        {
          tools: {
            rspack: {
              plugins: [marker],
            },
          },
        },
      ),
    );

    expect(plugins).toContain(marker);
    expect(
      plugins.some(
        (plugin) =>
          !!plugin &&
          typeof plugin === 'object' &&
          'name' in plugin &&
          plugin.name === 'RsdoctorRspackPlugin',
      ),
    ).toBe(true);
  });
});

test('resolveRsdoctorPlugin explains a missing package and rethrows other errors', () => {
  withEnv({ RSDOCTOR: 'true', CI: undefined }, () => {
    const missing = (code: string) =>
      Object.assign(new Error('missing'), { code });

    const capture = (load: () => never): unknown => {
      try {
        resolveRsdoctorPlugin(true, load);
      } catch (error) {
        return error;
      }
      return undefined;
    };

    expect(
      capture(() => {
        throw 'missing';
      }),
    ).toBe('missing');

    expect(
      capture(() => {
        throw null;
      }),
    ).toBeNull();

    expect(
      capture(() => {
        throw new Error('boom');
      }),
    ).toEqual(new Error('boom'));

    expect(
      capture(() => {
        throw missing('ENOENT');
      }),
    ).toMatchObject({ code: 'ENOENT' });

    expect(
      capture(() => {
        throw missing('MODULE_NOT_FOUND');
      }),
    ).toEqual(
      expect.objectContaining({
        message: expect.stringContaining('not installed'),
      }),
    );

    expect(
      capture(() => {
        throw missing('ERR_MODULE_NOT_FOUND');
      }),
    ).toEqual(
      expect.objectContaining({
        message: expect.stringContaining('@rsdoctor/rspack-plugin'),
      }),
    );
  });
});
