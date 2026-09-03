import { describe, expect, it } from "vitest";

import type { TranslationKey } from "@/i18n";

import { sampleCategories } from "@/features/dashboard/fixtures/dashboard-session-fixtures";
import {
  getCategoryDisplayName,
  mapCategoriesToItems,
} from "./category-display";

const translations: Readonly<Partial<Record<TranslationKey, string>>> = {
  food: "Comida",
  unclassified: "Sin clasificar",
};

const translate = (key: TranslationKey) => translations[key] ?? key;

describe("getCategoryDisplayName", () => {
  it("translates a recognized stable category identifier", () => {
    expect(getCategoryDisplayName({ id: "food" }, translate)).toBe("Comida");
    expect(
      getCategoryDisplayName(
        { id: "unclassified", name: "stale fixture name" },
        translate,
      ),
    ).toBe("Sin clasificar");
  });

  it("preserves the literal name of an unrecognized custom category", () => {
    expect(
      getCategoryDisplayName({ id: "custom-1", name: "Health" }, translate),
    ).toBe("Health");
  });

  it("maps session categories to zero-total presentation items", () => {
    const items = mapCategoriesToItems(sampleCategories, translate);

    expect(items[0]).toEqual({
      id: "food",
      name: "Comida",
      color: "coral",
      totalMinor: 0,
      canDelete: true,
    });
    expect(items.at(-1)).toMatchObject({
      id: "unclassified",
      totalMinor: 0,
      canDelete: false,
    });
  });
});
