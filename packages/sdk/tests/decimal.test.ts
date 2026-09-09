import { describe, expect, it } from "vitest";
import { assertDecimalString, decimalPercentage, formatDecimalString } from "../src/index";

describe("decimal helpers", () => {
  it("formats and rounds decimal strings without floating-point conversion", () => {
    expect(formatDecimalString("9007199254740993.125", 2)).toBe("9007199254740993.13");
    expect(formatDecimalString("0.004", 2)).toBe("0.00");
  });

  it("calculates a display percentage using scaled integers", () => {
    expect(decimalPercentage("42.00", "50.00")).toBe(84);
  });

  it("rejects number inputs for financial amounts", () => {
    expect(() => assertDecimalString(12.5, "amount")).toThrow("must be a valid decimal string");
  });
});
