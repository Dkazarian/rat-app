import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { getCategoryDisplayName } from "@/features/categories/category-display";
import {
  CategoryNotFoundError,
  ProtectedCategoryError,
} from "@/services/categories/category-errors";
import { ExpenseValidationError } from "@/services/expenses/expense-errors";
import { sampleCategories } from "@/features/dashboard/fixtures/dashboard-session-fixtures";
import { createI18n, type Locale } from "@/i18n";

import {
  createInitialPageSessionSeed,
  usePageSession,
} from "./use-page-session";

describe("usePageSession", () => {
  it("isolates simultaneous page sessions including category deletion and reassignment", () => {
    const first = renderHook(() =>
      usePageSession({
        ...createInitialPageSessionSeed(),
        categories: sampleCategories,
      }),
    );
    const second = renderHook(() =>
      usePageSession({
        ...createInitialPageSessionSeed(),
        categories: sampleCategories,
      }),
    );
    act(() => {
      first.result.current.createCategory("Health");
      first.result.current.captureExpenses([
        {
          id: "first",
          description: "Lunch",
          amountMinor: 100,
          categoryId: "food",
        },
      ]);
      second.result.current.deleteCategory("food");
    });
    expect(first.result.current.categories).toHaveLength(5);
    expect(
      first.result.current.categories.some(({ id }) => id === "food"),
    ).toBe(true);
    expect(second.result.current.categories).toHaveLength(3);
    expect(second.result.current.expenses).toEqual([]);
    act(() => {
      second.result.current.captureExpenses([
        {
          id: "second",
          description: "Taxi",
          amountMinor: 200,
          categoryId: "food",
        },
      ]);
    });
    expect(first.result.current.expenses).toHaveLength(1);
    expect(first.result.current.expenses[0].categoryId).toBe("food");
    expect(second.result.current.expenses[0].categoryId).toBe("unclassified");
    expect(first.result.current.summary.totalMinor).toBe(100);
    expect(second.result.current.summary.totalMinor).toBe(200);
    const secondExpenses = second.result.current.expenses;
    const secondCategories = second.result.current.categories;
    act(() => {
      first.result.current.deleteCategory("food");
    });
    expect(first.result.current.expenses[0].categoryId).toBe("unclassified");
    expect(
      first.result.current.categories.some(({ id }) => id === "food"),
    ).toBe(false);
    expect(second.result.current.expenses).toBe(secondExpenses);
    expect(second.result.current.categories).toBe(secondCategories);
  });

  it("applies mutation results without dropping unrelated expenses", () => {
    const first = {
      id: "first",
      description: "Lunch",
      amountMinor: 100,
      categoryId: "food",
    };
    const second = {
      id: "second",
      description: "Taxi",
      amountMinor: 200,
      categoryId: "transport",
    };
    const { result } = renderHook(() =>
      usePageSession({
        ...createInitialPageSessionSeed(),
        categories: sampleCategories,
        expenses: [first, second],
      }),
    );
    act(() => {
      expect(result.current.reclassifyExpense("first", "home")).toEqual({
        ...first,
        categoryId: "home",
      });
    });
    expect(result.current.expenses[1]).toBe(second);
    act(() => {
      expect(result.current.reassignExpensesFromCategory("home")).toEqual([
        { ...first, categoryId: "unclassified" },
      ]);
    });
    expect(result.current.expenses).toEqual([
      { ...first, categoryId: "unclassified" },
      second,
    ]);
    expect(result.current.expenses[1]).toBe(second);
    const previous = result.current.expenses;
    act(() => {
      expect(result.current.reassignExpensesFromCategory("home")).toEqual([]);
    });
    expect(result.current.expenses).toBe(previous);
    act(() => {
      expect(result.current.deleteExpense("first")).toBeUndefined();
    });
    expect(result.current.expenses).toEqual([second]);
    expect(result.current.summary.totalMinor).toBe(200);
  });

  it("appends only accepted candidates to existing expenses and reports partial success", () => {
    const { result } = renderHook(() => usePageSession());
    act(() => {
      result.current.captureExpenses([
        { id: "existing", description: "Existing", amountMinor: 100 },
      ]);
      result.current.changeInput("Coffee plus invalid expense");
      const outcome = result.current.captureExpenses([
        { id: "valid", description: "Coffee", amountMinor: 450 },
        { id: "invalid", description: "Bad", amountMinor: 0 },
      ]);
      expect(outcome.added.map(({ id }) => id)).toEqual(["valid"]);
      expect(outcome.errors).toHaveLength(1);
    });
    expect(result.current.expenses.map(({ id }) => id)).toEqual([
      "existing",
      "valid",
    ]);
    expect(result.current.summary.totalMinor).toBe(550);
    expect(result.current.inputValue).toBe("");
    expect(result.current.feedback).toEqual({
      state: "success",
      extractedCount: 1,
      rejectedCount: 1,
    });
  });

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
      const healthId = result.current.categories[1].id;
      act(() => {
        expect(
          result.current.captureExpenses([
            { description: "Vitamins", amountMinor: 500, categoryId: healthId },
            { description: "Novel", amountMinor: 900 },
          ]).added,
        ).toHaveLength(2);
      });
      const ids = [
        ...result.current.categories.slice(1),
        ...result.current.expenses,
      ].map(({ id }) => id);
      expect(ids.every((id) => id.length > 0)).toBe(true);
      expect(new Set(ids).size).toBe(4);
      expect(result.current.expenses[0].categoryId).toBe(healthId);
      act(() => {
        result.current.deleteCategory(healthId);
      });
      expect(result.current.expenses[0].categoryId).toBe("unclassified");
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("composes multiple intentions in one event without losing expenses or restoring deleted references", () => {
    const { result } = renderHook(() =>
      usePageSession({
        ...createInitialPageSessionSeed(),
        categories: sampleCategories,
      }),
    );
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
      "unclassified",
    ]);
  });

  it("appends an accepted capture, clears input, and records its count", () => {
    const { result } = renderHook(() =>
      usePageSession(
        { ...createInitialPageSessionSeed(), categories: sampleCategories },
        { createExpenseId: () => "expense-1" },
      ),
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
      usePageSession(
        { ...createInitialPageSessionSeed(), categories: sampleCategories },
        {
          createExpenseId: () => `expense-${++id}`,
        },
      ),
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
      categories: sampleCategories,
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
    act(() => {
      expect(result.current.captureExpenses([])).toEqual({
        added: [],
        errors: [],
      });
    });

    expect(result.current.expenses).toBe(seed.expenses);
    expect(result.current.inputValue).toBe(exactInput);
    expect(result.current.feedback).toEqual({ state: "extraction-failure" });

    act(() => {
      const outcome = result.current.captureExpenses([
        { id: "bad", description: " ", amountMinor: 100 },
      ]);
      expect(outcome.added).toEqual([]);
      expect(outcome.errors[0].error).toBeInstanceOf(ExpenseValidationError);
    });
    expect(result.current.expenses).toBe(seed.expenses);
    expect(result.current.inputValue).toBe(exactInput);
  });

  it("reclassifies and deletes expenses through one coordinating boundary", () => {
    const seed = {
      ...createInitialPageSessionSeed(),
      categories: sampleCategories,
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

  it("reassigns expenses when deleting a populated category through the session", () => {
    const seed = {
      ...createInitialPageSessionSeed(),
      categories: sampleCategories,
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

    act(() => {
      const outcome = result.current.deleteCategory("food");
      expect(outcome.deletedCategory.id).toBe("food");
      expect(outcome.categories.some(({ id }) => id === "food")).toBe(false);
    });

    expect(result.current.categories.some(({ id }) => id === "food")).toBe(
      false,
    );
    expect(result.current.expenses[0].categoryId).toBe("unclassified");
    expect(
      result.current.expenses.every((expense) =>
        result.current.categories.some(({ id }) => id === expense.categoryId),
      ),
    ).toBe(true);
    expect(result.current.summary.totalMinor).toBe(1_800);
    expect(
      result.current.summary.groups.find(
        ({ category }) => category.id === "unclassified",
      )?.totalMinor,
    ).toBe(1_800);
  });

  it("creates, captures, and deletes a custom category in one event", () => {
    const { result } = renderHook(() =>
      usePageSession(undefined, { createCategoryId: () => "health" }),
    );
    act(() => {
      const created = result.current.createCategory("Health");
      expect(
        created.categories.some(({ id }) => id === created.category.id),
      ).toBe(true);
      const captured = result.current.captureExpenses([
        {
          id: "vitamins",
          description: "Vitamins",
          amountMinor: 500,
          categoryId: created.category.id,
        },
      ]);
      expect(captured.added[0].categoryId).toBe("health");
      result.current.deleteCategory(created.category.id);
    });
    expect(result.current.categories.map(({ id }) => id)).toEqual([
      "unclassified",
    ]);
    expect(result.current.expenses[0].categoryId).toBe("unclassified");
    expect(result.current.summary.totalMinor).toBe(500);
  });

  it("preserves snapshots when category deletion targets are missing or protected", () => {
    const { result } = renderHook(() =>
      usePageSession({
        ...createInitialPageSessionSeed(),
        categories: sampleCategories,
        expenses: [
          {
            id: "existing",
            description: "Existing",
            amountMinor: 100,
            categoryId: "unclassified",
          },
        ],
      }),
    );
    const categories = result.current.categories;
    const expenses = result.current.expenses;
    act(() => {
      expect(() => result.current.deleteCategory("missing")).toThrow(
        CategoryNotFoundError,
      );
      expect(() => result.current.deleteCategory("unclassified")).toThrow(
        ProtectedCategoryError,
      );
    });
    expect(result.current.categories).toBe(categories);
    expect(result.current.expenses).toBe(expenses);
    expect(result.current.summary.totalMinor).toBe(100);
  });

  it("preserves domain state while localized presentation changes", () => {
    const i18n = createI18n();
    const { result, rerender } = renderHook(
      ({ locale }: { locale: Locale }) => {
        const session = usePageSession(
          { ...createInitialPageSessionSeed(), categories: sampleCategories },
          {
            createCategoryId: () => "custom-health",
            createExpenseId: () => "expense-1",
          },
        );
        const translate = i18n.getFixedT(locale);

        return {
          session,
          names: session.categories.map((category) =>
            getCategoryDisplayName(category, translate),
          ),
        };
      },
      { initialProps: { locale: "en" as Locale } },
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

    expect(result.current.names).toContain("Food");
    expect(result.current.names).toContain("Sin clasificar");
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

    expect(fresh.result.current.categories.map(({ id }) => id)).toEqual([
      "unclassified",
    ]);
    expect(fresh.result.current.expenses).toEqual([]);
    expect(fresh.result.current.inputValue).toBe("");
    expect(fresh.result.current.feedback).toEqual({ state: "empty" });
  });
});
