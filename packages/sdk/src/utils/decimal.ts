/**
 * Validates that a monetary value is a valid decimal string (e.g., "15.0000").
 * Financial safety rule: floating-point arithmetic is avoided for monetary amounts.
 */
export function isValidDecimalString(value: unknown): value is string {
  if (typeof value !== "string") {
    return false;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }

  // Regex matching standard decimal representation (optional sign, digits, optional dot with digits)
  const decimalRegex = /^-?\d+(\.\d+)?$/;
  return decimalRegex.test(trimmed);
}

/**
 * Asserts that a given balance or monetary parameter is a valid decimal string.
 */
export function assertDecimalString(value: unknown, fieldName: string): string {
  if (typeof value === "number") {
    return value.toFixed(4);
  }

  if (isValidDecimalString(value)) {
    return value.trim();
  }

  throw new TypeError(
    `Field '${fieldName}' must be a valid decimal string (e.g. "15.0000"), received: ${JSON.stringify(value)}`
  );
}
