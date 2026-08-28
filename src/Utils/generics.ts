export const isDefined = <T>(value: T | null | undefined): value is T =>
  value !== null && value !== undefined;

export const asArray = <T>(value: T | T[]): T[] =>
  Array.isArray(value) ? value : [value];

export const ensureString = (value: unknown, label = "value"): string => {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${label} must be a non-empty string.`);
  }

  return value;
};
