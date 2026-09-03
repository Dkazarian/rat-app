import { describe, expect, it } from "vitest";

import { createInitialCategories } from "@/features/categories/category-service";
import type { TranslationKey } from "@/i18n";

import {
  buildSpendingChartLabel,
  mapExpenseSummaryToSpendingItems,
  mapExpenseValuesToListItems,
} from "./expense-display";
import { selectExpenseSummary } from "./expense-selectors";
import type { Expense } from "./types";

const translations: Readonly<Partial<Record<TranslationKey, string>>> = {
  food: "Comida",
  home: "Casa",
  transport: "Transporte",
  unclassified: "Sin clasificar",
  spending: "Gastos",
  total: "total",
};

const translate = (key: TranslationKey) => translations[key] ?? key;
const categories = [
  ...createInitialCategories(),
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
  it("localizes built-in names but preserves descriptions and custom names", () => {
    expect(
      mapExpenseValuesToListItems(expenses, categories, translate),
    ).toEqual([
      {
        id: "expense-lunch",
        description: "Almuerzo with Alex",
        amountMinor: 1_800,
        categoryId: "food",
        categoryName: "Comida",
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
        expect.objectContaining({ categoryId: "food", name: "Comida" }),
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
      "es",
      translate,
    );
    const after = buildSpendingChartLabel(
      selectExpenseSummary(categories, expenses.slice(1)),
      "es",
      translate,
    );

    expect(before).toContain("Comida 80%");
    expect(before).toContain("Salud & Wellness 20%");
    expect(before).toContain("$22.50");
    expect(after).not.toContain("Comida 80%");
    expect(after).toContain("Salud & Wellness 100%");
    expect(after).toContain("$4.50");
  });
});
