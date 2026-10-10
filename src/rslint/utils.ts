import type { ResolvableConfig, TypedFlatConfig } from './types.ts';

/** Flatten nested config values into a single entry list. */
export function flattenConfigs(
  ...configs: ResolvableConfig[]
): TypedFlatConfig[] {
  const result: TypedFlatConfig[] = [];

  for (const config of configs) {
    if (!config) continue;
    if (Array.isArray(config)) {
      result.push(...flattenConfigs(...config));
      continue;
    }
    result.push(config);
  }

  return result;
}

export function toArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value];
}
