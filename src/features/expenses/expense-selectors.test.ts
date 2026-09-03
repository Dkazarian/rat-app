import { describe, expect, it } from "vitest";

import { createInitialCategories } from "@/features/categories/category-service";

import { selectExpenseSummary } from "./expense-selectors";
import type { Expense } from "./types";

const categories = createInitialCategories();
const expenses: ReadonlyArray<Expense> = [
  {
    id: "lunch",
    description: "Lunch",
    amountMinor: 1_800,
    categoryId: "food",
  },
  {
    id: "coffee",
    description: "Coffee",
    amountMinor: 450,
    categoryId: "food",
  },
  {
    id: "taxi",
    description: "Taxi",
    amountMinor: 1_200,
    categoryId: "transport",
  },
];

describe("selectExpenseSummary", () => {
  it("groups expenses in category order and derives all totals", () => {
    const summary = selectExpenseSummary(categories, expenses);

    expect(summary.totalMinor).toBe(3_450);
    expect(
      summary.groups.map(({ category, expenses, totalMinor }) => ({
        categoryId: category.id,
        expenseIds: expenses.map(({ id }) => id),
        totalMinor,
      })),
    ).toEqual([
      {
        categoryId: "food",
        expenseIds: ["lunch", "coffee"],
        totalMinor: 2_250,
      },
      { categoryId: "home", expenseIds: [], totalMinor: 0 },
      {
        categoryId: "transport",
        expenseIds: ["taxi"],
        totalMinor: 1_200,
      },
      { categoryId: "unclassified", expenseIds: [], totalMinor: 0 },
    ]);
  });

  it("retains current zero-total categories", () => {
    const summary = selectExpenseSummary(categories, []);

    expect(summary.groups.map(({ category }) => category.id)).toEqual([
      "food",
      "home",
      "transport",
      "unclassified",
    ]);
    expect(summary.groups.every(({ totalMinor }) => totalMinor === 0)).toBe(
      true,
    );
  });

  it("omits deleted categories and counts reassigned values only once", () => {
    const categoriesWithoutFood = categories.filter(({ id }) => id !== "food");
    const reassigned = expenses.map((expense) =>
      expense.categoryId === "food"
        ? { ...expense, categoryId: "unclassified" }
        : expense,
    );
    const summary = selectExpenseSummary(categoriesWithoutFood, reassigned);

    expect(summary.groups.some(({ category }) => category.id === "food")).toBe(
      false,
    );
    expect(
      summary.groups.find(({ category }) => category.id === "unclassified"),
    ).toMatchObject({ totalMinor: 2_250 });
    expect(summary.totalMinor).toBe(3_450);
  });

  it("derives synchronized percentages and chart slices", () => {
    const summary = selectExpenseSummary(categories, expenses);

    expect(
      summary.groups.map(({ category, percent }) => [category.id, percent]),
    ).toEqual([
      ["food", 65],
      ["home", 0],
      ["transport", 35],
      ["unclassified", 0],
    ]);
    expect(summary.chartSlices).toEqual(
      summary.groups.map(({ category, totalMinor, percent }) => ({
        categoryId: category.id,
        color: category.color,
        totalMinor,
        percent,
      })),
    );
  });

  it("returns safe zero percentages for an empty collection", () => {
    const summary = selectExpenseSummary(categories, []);

    expect(summary.totalMinor).toBe(0);
    expect(summary.chartSlices.every(({ percent }) => percent === 0)).toBe(
      true,
    );
    expect(
      summary.chartSlices.every(({ percent }) => Number.isFinite(percent)),
    ).toBe(true);
  });

  it("defensively groups a dangling expense under Unclassified", () => {
    const summary = selectExpenseSummary(categories, [
      { ...expenses[0], categoryId: "deleted" },
    ]);

    expect(
      summary.groups.find(({ category }) => category.id === "unclassified"),
    ).toMatchObject({ totalMinor: 1_800 });
  });

  it("supports current custom categories in their collection order", () => {
    const customCategories = [
      ...categories,
      {
        id: "health",
        kind: "custom" as const,
        name: "Health",
        color: "yellow" as const,
        system: false as const,
      },
    ];
    const summary = selectExpenseSummary(customCategories, [
      { ...expenses[0], categoryId: "health" },
    ]);

    expect(summary.groups.at(-1)?.category).toMatchObject({
      id: "health",
      name: "Health",
    });
  });
});
