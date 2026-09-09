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
  if (isValidDecimalString(value)) {
    return value.trim();
  }

  throw new TypeError(
    `Field '${fieldName}' must be a valid decimal string (e.g. "15.0000"), received: ${JSON.stringify(value)}`
  );
}

/** Formats a decimal string without converting the monetary value to a Number. */
export function formatDecimalString(value: string, fractionDigits = 2): string {
  const decimal = assertDecimalString(value, "value");
  if (!Number.isInteger(fractionDigits) || fractionDigits < 0) {
    throw new RangeError("fractionDigits must be a non-negative integer");
  }

  const negative = decimal.startsWith("-");
  const unsigned = negative ? decimal.slice(1) : decimal;
  const [integer, fraction = ""] = unsigned.split(".");
  const roundedInput = fraction.padEnd(fractionDigits + 1, "0");
  let scaled = BigInt(integer + roundedInput.slice(0, fractionDigits).padEnd(fractionDigits, "0"));
  if (Number(roundedInput[fractionDigits] ?? "0") >= 5) scaled += 1n;

  const digits = scaled.toString().padStart(fractionDigits + 1, "0");
  const formatted = fractionDigits === 0
    ? digits
    : `${digits.slice(0, -fractionDigits)}.${digits.slice(-fractionDigits)}`;
  return negative && scaled !== 0n ? `-${formatted}` : formatted;
}

/** Returns a percentage for display while keeping the decimal division in integer arithmetic. */
export function decimalPercentage(numerator: string, denominator: string): number {
  const toScaledInteger = (value: string, scale: number): bigint => {
    const [integer, fraction = ""] = assertDecimalString(value, "value").split(".");
    return BigInt(integer + fraction.padEnd(scale, "0").slice(0, scale));
  };
  const fractionDigits = Math.max(
    numerator.split(".")[1]?.length ?? 0,
    denominator.split(".")[1]?.length ?? 0
  );
  const top = toScaledInteger(numerator, fractionDigits);
  const bottom = toScaledInteger(denominator, fractionDigits);
  if (bottom <= 0n) return 0;
  const basisPoints = (top * 10000n) / bottom;
  return Number(basisPoints) / 100;
}
