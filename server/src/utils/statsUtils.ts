export function countUniqueFields<T>(array: T[], key: keyof T): Map<string, number> {
  const map = new Map<string, number>();

  for (const item of array) {
    const value = String(item[key]);
    map.set(value, (map.get(value) ?? 0) + 1);
  }

  return map;
}

export function mergeAndSumMaps<K>(a: Map<K, number>, b: Map<K, number>): Map<K, number> {
  const result = new Map(a);

  for (const [key, value] of b) {
    result.set(key, (result.get(key) ?? 0) + value);
  }

  return result;
}