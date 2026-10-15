import type { RstackConfig } from 'rstack';

/**
 * Rsbuild options for `define.app()` (`rs dev`, `rs build`, `rs preview`).
 * An object or a function of Rsbuild config params, same as `define.app()`.
 */
export type AppOptions = NonNullable<RstackConfig['app']>;

type AppFunction = Extract<AppOptions, (...args: never[]) => unknown>;

/** Params forwarded to an `app` factory. Rsbuild's `ConfigParams`. */
export type AppParams = AppFunction extends (env: infer Env) => unknown
  ? Env
  : never;

/**
 * Resolve `define.app()` input.
 *
 * Lives in its own module so `rs lint` / `rs fmt` do not load it. Site builds
 * stay on Rsbuild and do not pull the Rslib graph.
 */
export async function app(
  options: AppOptions,
  params: AppParams,
): Promise<Exclude<Awaited<ReturnType<AppFunction>>, AppFunction>> {
  if (typeof options === 'function') {
    return options(params);
  }

  return options;
}
