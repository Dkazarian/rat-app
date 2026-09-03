import { describe, expect, it } from "vitest";

import { createI18n } from "@/i18n";

import { sampleCategories } from "@/features/dashboard/fixtures/dashboard-session-fixtures";
import {
  getCategoryDisplayName,
  mapCategoriesToItems,
} from "./category-display";

const translate = createI18n("es").t;

describe("getCategoryDisplayName", () => {
  it("translates only Unclassified", () => {
    expect(
      getCategoryDisplayName(
        { id: null, name: "stale fixture name" },
        translate,
      ),
    ).toBe("Sin clasificar");
  });

  it.each(["food", "home", "transport", "unclassified", "null"])(
    "preserves custom names even when the ID is %s",
    (id) => {
      expect(
        getCategoryDisplayName({ id, name: "My category" }, translate),
      ).toBe("My category");
    },
  );

  it("preserves the literal name of an unrecognized custom category", () => {
    expect(
      getCategoryDisplayName({ id: "custom-1", name: "Health" }, translate),
    ).toBe("Health");
  });

  it("maps session categories to zero-total presentation items", () => {
    const items = mapCategoriesToItems(sampleCategories, translate);

    expect(items[0]).toEqual({
      id: "food",
      name: "Food",
      color: "coral",
      totalMinor: 0,
      canDelete: true,
    });
    expect(items.at(-1)).toMatchObject({
      id: null,
      totalMinor: 0,
      canDelete: false,
    });
  });
});
