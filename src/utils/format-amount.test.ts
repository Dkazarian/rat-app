import { describe, expect, it } from "vitest";

import { formatAmount } from "./format-amount";

describe("formatAmount", () => {
  it("formats integer minor units without grouping", () => {
    expect(formatAmount(128_450)).toBe("$1284.50");
  });

  it("rejects invalid minor-unit values", () => {
    expect(() => formatAmount(12.5)).toThrow(RangeError);
    expect(() => formatAmount(-1)).toThrow(RangeError);
  });

  it("formats whole and fractional minor units with exactly two decimals", () => {
    expect(formatAmount(1_800)).toBe("$18.00");
    expect(formatAmount(450)).toBe("$4.50");
    expect(formatAmount(1)).toBe("$0.01");
    expect(formatAmount(0)).toBe("$0.00");
  });
});
