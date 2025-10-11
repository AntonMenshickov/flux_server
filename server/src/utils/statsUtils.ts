export function countUniqueFields<T>(array: T[], key: keyof T): Map<string, number> {
  const map = new Map<string, number>();

  for (const item of array) {
    const value = String(item[key]);
    map.set(value, (map.get(value) ?? 0) + 1);
  }

  return map;
}