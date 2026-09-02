import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { getCategoryDisplayName } from "@/features/categories/category-display";
import { createInitialCategories } from "@/features/categories/category-rules";
import type { TranslationKey } from "@/i18n";

import {
  createInitialPageSessionSeed,
  usePageSession,
} from "./use-page-session";

const translations = {
  en: {
    food: "Food",
    home: "Home",
    transport: "Transport",
    unclassified: "Unclassified",
  },
  es: {
    food: "Comida",
    home: "Casa",
    transport: "Transporte",
    unclassified: "Sin clasificar",
  },
} as const;

describe("usePageSession", () => {
  it("creates distinct category and expense IDs when HTTP has no randomUUID", () => {
    vi.stubGlobal("crypto", {
      getRandomValues: crypto.getRandomValues.bind(crypto),
    });
    try {
      const { result } = renderHook(() => usePageSession());
      act(() => {
        expect(result.current.createCategory("Health").ok).toBe(true);
        expect(result.current.createCategory("Books").ok).toBe(true);
      });
      const healthId = result.current.categories[4].id;
      act(() => {
        expect(
          result.current.captureExpenses([
            { description: "Vitamins", amountMinor: 500, categoryId: healthId },
            { description: "Novel", amountMinor: 900 },
          ]).ok,
        ).toBe(true);
      });
      const ids = [
        ...result.current.categories.slice(4),
        ...result.current.expenses,
      ].map(({ id }) => id);
      expect(ids.every((id) => id.length > 0)).toBe(true);
      expect(new Set(ids).size).toBe(4);
      expect(result.current.expenses[0].categoryId).toBe(healthId);
      act(() => void result.current.deleteCategory(healthId));
      expect(result.current.expenses[0].categoryId).toBe("unclassified");
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("composes multiple intentions in one event without losing expenses or restoring deleted references", () => {
    const { result } = renderHook(() => usePageSession());
    act(() => {
      result.current.captureExpenses([
        {
          id: "first",
          description: "First",
          amountMinor: 100,
          categoryId: "food",
        },
      ]);
      result.current.deleteCategory("food");
      result.current.captureExpenses([
        {
          id: "second",
          description: "Second",
          amountMinor: 200,
          categoryId: "food",
        },
      ]);
    });
    expect(result.current.expenses).toEqual([
      {
        id: "first",
        description: "First",
        amountMinor: 100,
        categoryId: "unclassified",
      },
      {
        id: "second",
        description: "Second",
        amountMinor: 200,
        categoryId: "unclassified",
      },
    ]);
    expect(result.current.categories.some(({ id }) => id === "food")).toBe(
      false,
    );
    expect(result.current.summary.totalMinor).toBe(300);
  });
  it("initializes once and keeps stable collections across rerenders", () => {
    const firstSeed = createInitialPageSessionSeed();
    const { result, rerender } = renderHook(
      ({ seed }) => usePageSession(seed),
      { initialProps: { seed: firstSeed } },
    );
    const initialCategories = result.current.categories;

    rerender({ seed: { ...firstSeed, categories: [] } });

    expect(result.current.categories).toBe(initialCategories);
    expect(result.current.categories.map(({ id }) => id)).toEqual([
      "food",
      "home",
      "transport",
      "unclassified",
    ]);
  });

  it("appends an accepted capture, clears input, and records its count", () => {
    const { result } = renderHook(() =>
      usePageSession(undefined, { createExpenseId: () => "expense-1" }),
    );

    act(() => result.current.changeInput("Lunch $18"));
    act(() => {
      result.current.captureExpenses([
        { description: "Lunch", amountMinor: 1_800, categoryId: "food" },
      ]);
    });

    expect(result.current.expenses).toEqual([
      {
        id: "expense-1",
        description: "Lunch",
        amountMinor: 1_800,
        categoryId: "food",
      },
    ]);
    expect(result.current.inputValue).toBe("");
    expect(result.current.feedback).toEqual({
      state: "success",
      extractedCount: 1,
    });
  });

  it("accumulates sequential deterministic batches and derives combined output", () => {
    let id = 0;
    const { result } = renderHook(() =>
      usePageSession(undefined, {
        createExpenseId: () => `expense-${++id}`,
      }),
    );

    act(() => {
      result.current.captureExpenses([
        { description: "Lunch", amountMinor: 1_800, categoryId: "food" },
      ]);
    });
    act(() => {
      result.current.captureExpenses([
        { description: "Taxi", amountMinor: 1_200, categoryId: "transport" },
      ]);
    });

    expect(result.current.expenses.map(({ id }) => id)).toEqual([
      "expense-1",
      "expense-2",
    ]);
    expect(result.current.summary.totalMinor).toBe(3_000);
    expect(
      result.current.summary.groups.map(({ category, totalMinor }) => [
        category.id,
        totalMinor,
      ]),
    ).toEqual([
      ["food", 1_800],
      ["home", 0],
      ["transport", 1_200],
      ["unclassified", 0],
    ]);
  });

  it("preserves exact input and expenses when capture is empty or invalid", () => {
    const seed = {
      ...createInitialPageSessionSeed(),
      expenses: [
        {
          id: "existing",
          description: "Existing",
          amountMinor: 500,
          categoryId: "home",
        },
      ],
    };
    const { result } = renderHook(() => usePageSession(seed));
    const exactInput = "  coffee???\n$4.50  ";

    act(() => result.current.changeInput(exactInput));
    act(() => void result.current.captureExpenses([]));

    expect(result.current.expenses).toBe(seed.expenses);
    expect(result.current.inputValue).toBe(exactInput);
    expect(result.current.feedback).toEqual({ state: "extraction-failure" });

    act(() => {
      result.current.captureExpenses([
        { id: "bad", description: " ", amountMinor: 100 },
      ]);
    });
    expect(result.current.expenses).toBe(seed.expenses);
    expect(result.current.inputValue).toBe(exactInput);
  });

  it("reclassifies and deletes expenses through one coordinating boundary", () => {
    const seed = {
      ...createInitialPageSessionSeed(),
      expenses: [
        {
          id: "expense-1",
          description: "Taxi",
          amountMinor: 1_200,
          categoryId: "transport",
        },
      ],
    };
    const { result } = renderHook(() => usePageSession(seed));

    act(() => void result.current.reclassifyExpense("expense-1", "home"));
    expect(result.current.expenses[0].categoryId).toBe("home");
    expect(result.current.summary.groups[1].totalMinor).toBe(1_200);

    act(() => void result.current.deleteExpense("expense-1"));
    expect(result.current.expenses).toEqual([]);
    expect(result.current.summary.totalMinor).toBe(0);
  });

  it("deletes a populated category and reassigns its expenses atomically", () => {
    const seed = {
      ...createInitialPageSessionSeed(),
      expenses: [
        {
          id: "expense-1",
          description: "Lunch",
          amountMinor: 1_800,
          categoryId: "food",
        },
      ],
    };
    const { result } = renderHook(() => usePageSession(seed));

    act(() => void result.current.deleteCategory("food"));

    expect(result.current.categories.some(({ id }) => id === "food")).toBe(
      false,
    );
    expect(result.current.expenses[0].categoryId).toBe("unclassified");
    expect(
      result.current.expenses.every((expense) =>
        result.current.categories.some(({ id }) => id === expense.categoryId),
      ),
    ).toBe(true);
  });

  it("preserves domain state while localized presentation changes", () => {
    const { result, rerender } = renderHook(
      ({ locale }: { locale: "en" | "es" }) => {
        const session = usePageSession(undefined, {
          createCategoryId: () => "custom-health",
          createExpenseId: () => "expense-1",
        });
        const translate = (key: TranslationKey) =>
          translations[locale][key as keyof (typeof translations)["en"]] ?? key;

        return {
          session,
          names: session.categories.map((category) =>
            getCategoryDisplayName(category, translate),
          ),
        };
      },
      { initialProps: { locale: "en" as "en" | "es" } },
    );

    act(() => {
      result.current.session.createCategory("Health");
      result.current.session.changeInput("  exact input  ");
      result.current.session.captureExpenses([
        { description: "Literal lunch", amountMinor: 100, categoryId: "food" },
      ]);
      result.current.session.changeInput("  exact input  ");
    });
    const expenseId = result.current.session.expenses[0].id;

    rerender({ locale: "es" });

    expect(result.current.names).toContain("Comida");
    expect(result.current.names).toContain("Health");
    expect(result.current.session.expenses[0]).toMatchObject({
      id: expenseId,
      description: "Literal lunch",
    });
    expect(result.current.session.inputValue).toBe("  exact input  ");
  });

  it("starts clean after unmounting and creating a fresh session", () => {
    const first = renderHook(() => usePageSession());
    act(() => first.result.current.changeInput("temporary"));
    first.unmount();

    const fresh = renderHook(() => usePageSession());

    expect(fresh.result.current.categories).toEqual(createInitialCategories());
    expect(fresh.result.current.expenses).toEqual([]);
    expect(fresh.result.current.inputValue).toBe("");
    expect(fresh.result.current.feedback).toEqual({ state: "empty" });
  });
});
