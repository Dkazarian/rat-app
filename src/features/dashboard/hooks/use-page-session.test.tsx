import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { getCategoryDisplayName } from "@/features/categories/category-display";
import { ExpenseValidationError } from "@/services/expenses/expense-errors";
import { sampleCategories } from "@/features/dashboard/fixtures/dashboard-session-fixtures";
import { createI18n, type Locale } from "@/i18n";
import {
  createInitialPageSessionSeed,
  usePageSession,
} from "./use-page-session";

const lunch = { description: "Lunch", amountMinor: 100, categoryId: "food" };
const taxi = { description: "Taxi", amountMinor: 200, categoryId: "transport" };
const seeded = (expenses = [lunch, taxi]) => ({
  ...createInitialPageSessionSeed(),
  categories: sampleCategories,
  expenses,
});

import type {
  PageSession,
  CapturedExpenseCandidate,
} from "@/features/dashboard/types";

function idFor(session: PageSession, name: string): string {
  const category = session.categories.find(
    (category) => category.kind === "custom" && category.name === name,
  );
  if (!category || category.id === null)
    throw new Error("Missing test category: " + name);
  return category.id;
}
function capture(
  session: PageSession,
  candidates: ReadonlyArray<CapturedExpenseCandidate>,
) {
  return session.captureExpenses(
    candidates.map((candidate) => ({
      ...candidate,
      categoryId:
        session.categories.find(
          (category) =>
            category.kind === "custom" &&
            category.name.toLowerCase() === candidate.categoryId,
        )?.id ?? candidate.categoryId,
    })),
  );
}

describe("usePageSession", () => {
  it("isolates simultaneous sessions including category deletion and reassignment", () => {
    const first = renderHook(() => usePageSession(seeded([])));
    const second = renderHook(() => usePageSession(seeded([])));
    act(() => {
      first.result.current.createCategory("Health");
      capture(first.result.current, [lunch]);
      second.result.current.deleteCategory(
        idFor(second.result.current, "Food"),
      );
      capture(second.result.current, [lunch]);
    });
    expect(first.result.current.categories).toHaveLength(5);
    expect(second.result.current.categories).toHaveLength(3);
    expect(first.result.current.expenses[0].categoryId).toBe(
      idFor(first.result.current, "Food"),
    );
    expect(second.result.current.expenses[0].categoryId).toBeNull();
    const secondExpenses = second.result.current.expenses;
    const secondCategories = second.result.current.categories;
    act(() => {
      first.result.current.deleteCategory(idFor(first.result.current, "Food"));
    });
    expect(first.result.current.expenses[0].categoryId).toBeNull();
    expect(second.result.current.expenses).toBe(secondExpenses);
    expect(second.result.current.categories).toBe(secondCategories);
  });

  it("initializes snapshots with generated IDs and applies mutations without dropping unrelated expenses", () => {
    const { result } = renderHook(() => usePageSession(seeded()));
    const [first, second] = result.current.expenses;
    expect(first).toEqual({
      ...lunch,
      categoryId: idFor(result.current, "Food"),
      id: expect.any(String),
    });
    act(() => {
      expect(
        result.current.reclassifyExpense(
          first.id,
          idFor(result.current, "Home"),
        ),
      ).toEqual({
        ...first,
        categoryId: idFor(result.current, "Home"),
      });
    });
    expect(result.current.expenses[1]).toBe(second);
    act(() => {
      expect(
        result.current.reassignExpensesFromCategory(
          idFor(result.current, "Home"),
        ),
      ).toEqual([{ ...first, categoryId: null }]);
    });
    expect(result.current.expenses).toEqual([
      { ...first, categoryId: null },
      second,
    ]);
    const previous = result.current.expenses;
    act(() => {
      expect(
        result.current.reassignExpensesFromCategory(
          idFor(result.current, "Home"),
        ),
      ).toEqual([]);
    });
    expect(result.current.expenses).toBe(previous);
    act(() => {
      expect(result.current.deleteExpense(first.id)).toBeUndefined();
    });
    expect(result.current.expenses).toEqual([second]);
    expect(result.current.summary.totalMinor).toBe(200);
  });

  it("initializes from accepted service records when a seed contains invalid candidates", () => {
    const { result } = renderHook(() =>
      usePageSession(seeded([lunch, { ...taxi, amountMinor: 0 }])),
    );
    expect(result.current.expenses).toEqual([
      {
        ...lunch,
        categoryId: idFor(result.current, "Food"),
        id: expect.any(String),
      },
    ]);
    expect(result.current.summary.totalMinor).toBe(100);
    act(() => {
      result.current.deleteExpense(result.current.expenses[0].id);
    });
    expect(result.current.expenses).toEqual([]);
  });

  it("appends accepted candidates and reports partial success while preserving prior expenses", () => {
    const { result } = renderHook(() => usePageSession());
    act(() => {
      capture(result.current, [{ ...lunch, categoryId: null }]);
      result.current.changeInput("Coffee plus invalid expense");
      const outcome = capture(result.current, [
        { description: "Coffee", amountMinor: 450, categoryId: null },
        { description: "Bad", amountMinor: 0, categoryId: null },
      ]);
      expect(outcome.added).toEqual([
        {
          id: expect.any(String),
          description: "Coffee",
          amountMinor: 450,
          categoryId: null,
        },
      ]);
      expect(outcome.errors).toHaveLength(1);
    });
    expect(
      result.current.expenses.map(({ description }) => description),
    ).toEqual(["Lunch", "Coffee"]);
    expect(result.current.summary.totalMinor).toBe(550);
    expect(result.current.inputValue).toBe("");
    expect(result.current.feedback).toEqual({
      state: "success",
      extractedCount: 1,
      rejectedCount: 1,
    });
  });

  it("creates category IDs using the fallback when randomUUID is unavailable", () => {
    vi.stubGlobal("crypto", {
      getRandomValues: crypto.getRandomValues.bind(crypto),
    });
    try {
      const { result } = renderHook(() => usePageSession());
      act(() => {
        result.current.createCategory("Health");
        result.current.createCategory("Books");
      });
      const ids = result.current.categories
        .filter(({ system }) => !system)
        .map(({ id }) => id);
      expect(ids.every((id) => typeof id === "string" && id.length > 0)).toBe(
        true,
      );
      expect(new Set(ids).size).toBe(2);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("composes capture, category deletion, and another capture within one event", () => {
    const { result } = renderHook(() => usePageSession(seeded([])));
    act(() => {
      capture(result.current, [lunch]);
      result.current.deleteCategory(idFor(result.current, "Food"));
      capture(result.current, [
        { ...lunch, description: "Second", amountMinor: 200 },
      ]);
    });
    expect(result.current.expenses).toEqual([
      { ...lunch, id: expect.any(String), categoryId: null },
      {
        ...lunch,
        id: expect.any(String),
        description: "Second",
        amountMinor: 200,
        categoryId: null,
      },
    ]);
    expect(result.current.categories.some(({ id }) => id === "food")).toBe(
      false,
    );
    expect(result.current.summary.totalMinor).toBe(300);
  });

  it("initializes once and preserves category and expense snapshots across rerenders", () => {
    const firstSeed = seeded();
    const { result, rerender } = renderHook(
      ({ seed }) => usePageSession(seed),
      { initialProps: { seed: firstSeed } },
    );
    const categories = result.current.categories;
    const expenses = result.current.expenses;
    rerender({ seed: { ...firstSeed, categories: [], expenses: [] } });
    expect(result.current.categories).toBe(categories);
    expect(result.current.expenses).toBe(expenses);
  });

  it("clears input after capture and accumulates repeated batches with fresh IDs", () => {
    const { result } = renderHook(() => usePageSession(seeded([])));
    act(() => {
      result.current.changeInput("Lunch");
    });
    act(() => {
      capture(result.current, [lunch]);
    });
    const first = result.current.expenses[0];
    expect(result.current.inputValue).toBe("");
    expect(result.current.feedback).toEqual({
      state: "success",
      extractedCount: 1,
    });
    act(() => {
      capture(result.current, [lunch, taxi]);
    });
    expect(result.current.expenses).toHaveLength(3);
    expect(result.current.expenses[0]).toBe(first);
    expect(new Set(result.current.expenses.map(({ id }) => id)).size).toBe(3);
    expect(result.current.summary.totalMinor).toBe(400);
    expect(
      result.current.summary.groups.map(({ category, totalMinor }) => [
        category.kind === "custom" ? category.name.toLowerCase() : null,
        totalMinor,
      ]),
    ).toEqual([
      ["food", 200],
      ["home", 0],
      ["transport", 200],
      [null, 0],
    ]);
  });

  it("preserves exact input and expense snapshots when capture is empty or invalid", () => {
    const { result } = renderHook(() => usePageSession(seeded()));
    const expenses = result.current.expenses;
    const input = "  coffee???\n$4.50  ";
    act(() => {
      result.current.changeInput(input);
    });
    act(() => {
      expect(capture(result.current, [])).toEqual({
        added: [],
        errors: [],
      });
    });
    expect(result.current.expenses).toBe(expenses);
    expect(result.current.inputValue).toBe(input);
    expect(result.current.feedback).toEqual({ state: "extraction-failure" });
    act(() => {
      const outcome = capture(result.current, [{ ...lunch, description: " " }]);
      expect(outcome.added).toEqual([]);
      expect(outcome.errors[0].error).toBeInstanceOf(ExpenseValidationError);
    });
    expect(result.current.expenses).toBe(expenses);
    expect(result.current.inputValue).toBe(input);
  });

  it("reclassifies and deletes a captured expense by the generated ID in one event", () => {
    const { result } = renderHook(() => usePageSession(seeded([])));
    act(() => {
      const expense = capture(result.current, [taxi]).added[0];
      result.current.reclassifyExpense(
        expense.id,
        idFor(result.current, "Home"),
      );
      result.current.deleteExpense(expense.id);
    });
    expect(result.current.expenses).toEqual([]);
    expect(result.current.summary.totalMinor).toBe(0);
  });

  it("reassigns seeded expenses and updates summaries when deleting a populated category", () => {
    const { result } = renderHook(() => usePageSession(seeded([lunch])));
    act(() => {
      const outcome = result.current.deleteCategory(
        idFor(result.current, "Food"),
      );
      expect(outcome.deletedCategory).toMatchObject({ name: "Food" });
      expect(outcome.categories.some(({ id }) => id === "food")).toBe(false);
    });
    expect(result.current.expenses[0].categoryId).toBeNull();
    expect(
      result.current.expenses.every((expense) =>
        result.current.categories.some(({ id }) => id === expense.categoryId),
      ),
    ).toBe(true);
    expect(result.current.summary.totalMinor).toBe(100);
    expect(
      result.current.summary.groups.find(({ category }) => category.id === null)
        ?.totalMinor,
    ).toBe(100);
  });

  it("creates, captures, and deletes a custom category in one event", () => {
    const { result } = renderHook(() => usePageSession());
    act(() => {
      const created = result.current.createCategory("Health");
      expect(
        created.categories.some(({ id }) => id === created.category.id),
      ).toBe(true);
      const captured = capture(result.current, [
        {
          description: "Vitamins",
          amountMinor: 500,
          categoryId: created.category.id,
        },
      ]);
      expect(captured.added[0].categoryId).toBe(created.category.id);
      result.current.deleteCategory(created.category.id);
    });
    expect(result.current.categories.map(({ id }) => id)).toEqual([null]);
    expect(result.current.expenses[0].categoryId).toBeNull();
    expect(result.current.summary.totalMinor).toBe(500);
  });

  it("preserves snapshots for missing and protected category deletion targets", () => {
    const { result } = renderHook(() => usePageSession(seeded()));
    const categories = result.current.categories;
    const expenses = result.current.expenses;
    act(() => {
      expect(result.current.deleteCategory("missing").ok).toBe(true);
      expect(result.current.deleteCategory(null).ok).toBe(true);
    });
    expect(result.current.categories).toEqual(categories);
    expect(result.current.expenses).toBe(expenses);
  });

  it("preserves domain state while localized presentation changes", () => {
    const i18n = createI18n();
    const { result, rerender } = renderHook(
      ({ locale }: { locale: Locale }) => {
        const session = usePageSession(seeded([]));
        return {
          session,
          names: session.categories.map((category) =>
            getCategoryDisplayName(category, i18n.getFixedT(locale)),
          ),
        };
      },
      { initialProps: { locale: "en" as Locale } },
    );
    act(() => {
      result.current.session.createCategory("Health");
      capture(result.current.session, [lunch]);
      result.current.session.changeInput("  exact input  ");
    });
    const expense = result.current.session.expenses[0];
    rerender({ locale: "es" });
    expect(result.current.names).toContain("Food");
    expect(result.current.names).toContain("Sin clasificar");
    expect(result.current.names).toContain("Health");
    expect(result.current.session.expenses[0]).toBe(expense);
    expect(result.current.session.inputValue).toBe("  exact input  ");
  });

  it("starts clean after unmounting and creating a fresh session", () => {
    const first = renderHook(() => usePageSession(seeded()));
    act(() => {
      first.result.current.changeInput("temporary");
    });
    first.unmount();
    const fresh = renderHook(() => usePageSession());
    expect(fresh.result.current.categories.map(({ id }) => id)).toEqual([null]);
    expect(fresh.result.current.expenses).toEqual([]);
    expect(fresh.result.current.inputValue).toBe("");
    expect(fresh.result.current.feedback).toEqual({ state: "empty" });
  });
});
