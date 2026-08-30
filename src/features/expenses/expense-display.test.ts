import { describe, expect, it } from "vitest";

import { dashboardFixtures } from "@/fixtures/dashboard-fixtures";
import type { TranslationKey } from "@/i18n";

import {
  mapCategorySpendingToItems,
  mapExpensesToListItems,
} from "./expense-display";

const translations: Readonly<Partial<Record<TranslationKey, string>>> = {
  lunch: "Almuerzo",
  food: "Comida",
};

const translate = (key: TranslationKey) => translations[key] ?? key;

describe("expense presentation mapping", () => {
  it("localizes expense descriptions and their category names", () => {
    expect(
      mapExpensesToListItems(dashboardFixtures.success.expenses, translate)[0],
    ).toMatchObject({ description: "Almuerzo", categoryName: "Comida" });
  });

  it("localizes spending category names", () => {
    expect(
      mapCategorySpendingToItems(
        dashboardFixtures.success.categorySpending.items,
        translate,
      )[0],
    ).toMatchObject({ name: "Comida" });
  });
});
