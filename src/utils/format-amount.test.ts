import { describe, expect, it } from "vitest";

import { formatAmount } from "./format-amount";

describe("formatAmount", () => {
  it("formats integer minor units in English", () => {
    expect(formatAmount(128_450, "en")).toBe("$1284.50");
  });

  it("formats integer minor units in Spanish", () => {
    expect(formatAmount(128_450, "es")).toBe("$1284.50");
  });

  it("rejects invalid minor-unit values", () => {
    expect(() => formatAmount(12.5, "en")).toThrow(RangeError);
    expect(() => formatAmount(-1, "en")).toThrow(RangeError);
  });

  it("formats whole and fractional minor units with exactly two decimals", () => {
    expect(formatAmount(1_800, "en")).toBe("$18.00");
    expect(formatAmount(450, "en")).toBe("$4.50");
    expect(formatAmount(1_800, "es")).toBe("$18.00");
    expect(formatAmount(450, "es")).toBe("$4.50");
  });
});
