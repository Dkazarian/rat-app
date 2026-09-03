import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { ApplicationError } from "./errors";
import {
  createCategoryRecord,
  normalizeCategoryName,
  toCategoriesResponse,
  type StoredCategory,
} from "./category-rules";

describe("category rules", () => {
  it.each(["Food", "Home", "Transport"])(
    "accepts %s as an ordinary category",
    (name) => {
      expect(createCategoryRecord([], name, randomUUID()).name).toBe(name);
    },
  );

  it.each(["", "   ", "Unclassified", "unCLASSIFIED", "Sin clasificar"])(
    "rejects the reserved or empty name %j",
    (name) => {
      expect(() => normalizeCategoryName(name)).toThrow(ApplicationError);
    },
  );

  it("trims names, rejects duplicates, and assigns palette colors", () => {
    const first = createCategoryRecord([], " Food ", randomUUID());
    expect(first).toMatchObject({ name: "Food", color: "coral" });
    expect(() => createCategoryRecord([first], "food", randomUUID())).toThrow(
      expect.objectContaining({ code: "category_name_duplicate" }),
    );
    expect(createCategoryRecord([first], "Home", randomUUID()).color).toBe(
      "purple",
    );
  });

  it("enforces ten real categories", () => {
    const categories: StoredCategory[] = Array.from(
      { length: 10 },
      (_, index) => ({
        id: randomUUID(),
        name: `Category ${index}`,
        color: "coral",
      }),
    );
    expect(() =>
      createCategoryRecord(categories, "Next", randomUUID()),
    ).toThrow(expect.objectContaining({ code: "category_limit_reached" }));
  });

  it("calculates category and Unclassified totals from expenses", () => {
    const categoryId = randomUUID();
    expect(
      toCategoriesResponse(
        [{ id: categoryId, name: "Food", color: "coral" }],
        [
          {
            id: randomUUID(),
            description: "Lunch",
            amountMinor: 500,
            categoryId,
            createdAt: 2,
          },
          {
            id: randomUUID(),
            description: "Other",
            amountMinor: 250,
            categoryId: null,
            createdAt: 1,
          },
        ],
      ),
    ).toEqual({
      categories: [
        { id: categoryId, name: "Food", color: "coral", totalMinor: 500 },
      ],
      unclassifiedTotalMinor: 250,
      totalMinor: 750,
    });
  });
});
