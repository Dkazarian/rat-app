import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { dashboardFixtures } from "@/fixtures/dashboard-fixtures";

import { useExpenseSession } from "./use-expense-session";

describe("useExpenseSession", () => {
  it("defaults production sessions to the empty fixture seed", () => {
    const { result } = renderHook(() => useExpenseSession());

    expect(result.current.feedbackState).toBe("empty");
    expect(result.current.expenses).toEqual([]);
  });

  it("uses the fixture as a one-time expense presentation seed", () => {
    const initialSeed = dashboardFixtures.success;
    const { result, rerender } = renderHook(
      ({ seed }) => useExpenseSession(seed),
      { initialProps: { seed: initialSeed } },
    );

    expect(result.current.feedbackState).toBe("success");
    expect(result.current.expenses).toBe(initialSeed.expenses);
    expect(result.current.categorySpending).toBe(initialSeed.categorySpending);

    rerender({ seed: dashboardFixtures.empty });

    expect(result.current.feedbackState).toBe("success");
    expect(result.current.expenses).toBe(initialSeed.expenses);
  });

  it("exposes the category session through the same boundary", () => {
    const { result } = renderHook(() =>
      useExpenseSession(dashboardFixtures.empty),
    );

    act(() => {
      result.current.deleteCategory("food");
    });

    expect(result.current.categories.map(({ id }) => id)).toEqual([
      "home",
      "transport",
      "unclassified",
    ]);
  });
});
