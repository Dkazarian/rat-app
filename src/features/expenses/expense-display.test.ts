import { describe, expect, it } from "vitest";

import { sampleCategories } from "@/features/dashboard/fixtures/dashboard-session-fixtures";
import { createI18n } from "@/i18n";

import {
  buildSpendingChartLabel,
  mapExpenseSummaryToSpendingItems,
  mapExpenseValuesToListItems,
} from "./expense-display";
import { selectExpenseSummary } from "./expense-selectors";
import type { Expense } from "@/services/expenses/types";

const translate = createI18n("es").t;
const categories = [
  ...sampleCategories,
  {
    id: "health",
    kind: "custom" as const,
    name: "Salud & Wellness",
    color: "yellow" as const,
    system: false as const,
  },
];
const expenses: ReadonlyArray<Expense> = [
  {
    id: "expense-lunch",
    description: "Almuerzo with Alex",
    amountMinor: 1_800,
    categoryId: "food",
  },
  {
    id: "expense-vitamins",
    description: "Vitaminas",
    amountMinor: 450,
    categoryId: "health",
  },
];

describe("expense presentation mapping", () => {
  it("preserves descriptions and custom category names", () => {
    expect(
      mapExpenseValuesToListItems(expenses, categories, translate),
    ).toEqual([
      {
        id: "expense-lunch",
        description: "Almuerzo with Alex",
        amountMinor: 1_800,
        categoryId: "food",
        categoryName: "Food",
        color: "coral",
      },
      {
        id: "expense-vitamins",
        description: "Vitaminas",
        amountMinor: 450,
        categoryId: "health",
        categoryName: "Salud & Wellness",
        color: "yellow",
      },
    ]);
  });

  it("maps derived spending while preserving custom category names", () => {
    const summary = selectExpenseSummary(categories, expenses);

    expect(mapExpenseSummaryToSpendingItems(summary, translate)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ categoryId: "food", name: "Food" }),
        expect.objectContaining({
          categoryId: "health",
          name: "Salud & Wellness",
        }),
      ]),
    );
  });

  it("derives chart accessibility text from current values", () => {
    const before = buildSpendingChartLabel(
      selectExpenseSummary(categories, expenses),
      translate,
    );
    const after = buildSpendingChartLabel(
      selectExpenseSummary(categories, expenses.slice(1)),
      translate,
    );

    expect(before).toContain("Food 80%");
    expect(before).toContain("Salud & Wellness 20%");
    expect(before).toContain("$22.50");
    expect(after).not.toContain("Food 80%");
    expect(after).toContain("Salud & Wellness 100%");
    expect(after).toContain("$4.50");
  });
});
