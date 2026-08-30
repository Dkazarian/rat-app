import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useCategories } from "./use-categories";

describe("useCategories", () => {
  it("owns a lazily initialized category session and applies pure operations", () => {
    let nextId = 0;
    const { result, rerender } = renderHook(() =>
      useCategories(() => `custom-${nextId++}`),
    );

    expect(result.current.categories.map(({ id }) => id)).toEqual([
      "food",
      "home",
      "transport",
      "unclassified",
    ]);

    act(() => {
      expect(result.current.createCategory("  Health  ")).toMatchObject({
        ok: true,
        category: { id: "custom-0", name: "Health" },
      });
    });
    rerender();

    expect(result.current.categories.at(-1)).toMatchObject({
      id: "custom-0",
      name: "Health",
    });

    act(() => {
      expect(result.current.deleteCategory("food")).toMatchObject({ ok: true });
    });

    expect(result.current.categories.some(({ id }) => id === "food")).toBe(
      false,
    );
  });

  it("returns stable validation results without changing its categories", () => {
    const { result } = renderHook(() => useCategories(() => "unused"));
    const initial = result.current.categories;

    act(() => {
      expect(result.current.createCategory("   ")).toMatchObject({
        ok: false,
        code: "empty",
      });
    });

    expect(result.current.categories).toBe(initial);
  });
});
