import { describe, expect, it } from "vitest";

import {
  CATEGORY_LIMIT,
  CATEGORY_NAME_MAX_LENGTH,
  builtInCategoryNames,
  createCategory,
  createInitialCategories,
  deleteCategory,
  normalizeCategoryName,
  selectCategoryColor,
  validateCategoryName,
} from "./category-rules";
import { nonMutedCategoryColorTokens } from "./types";
import type { Category } from "./types";

describe("createInitialCategories", () => {
  it("creates the built-ins in their required order with stable identities", () => {
    const categories = createInitialCategories();

    expect(categories.map(({ id }) => id)).toEqual([
      "food",
      "home",
      "transport",
      "unclassified",
    ]);
    expect(
      categories.map((category) =>
        category.kind === "built-in" ? category.identity : undefined,
      ),
    ).toEqual(["food", "home", "transport", "unclassified"]);
  });

  it("returns a fresh immutable collection shape on every call", () => {
    const first = createInitialCategories();
    const second = createInitialCategories();

    expect(second).toEqual(first);
    expect(second).not.toBe(first);
    expect(second[0]).not.toBe(first[0]);
  });

  it("represents built-in identities separately from literal custom names", () => {
    const initial = createInitialCategories();
    const created = createCategory(initial, {
      id: "custom-food-journal",
      name: "Food journal",
    });

    expect(initial[0]).toMatchObject({ kind: "built-in", identity: "food" });
    expect(initial[0]).not.toHaveProperty("name");
    expect(created).toMatchObject({
      ok: true,
      category: { kind: "custom", name: "Food journal" },
    });
  });

  it("reserves muted for the permanent Unclassified category", () => {
    const categories = createInitialCategories();

    expect(categories.find(({ id }) => id === "unclassified")).toMatchObject({
      color: "muted",
      system: true,
    });
    expect(
      categories
        .filter(({ id }) => id !== "unclassified")
        .every(({ color }) => color !== "muted"),
    ).toBe(true);
  });
});

describe("category name validation", () => {
  it("trims surrounding whitespace", () => {
    expect(normalizeCategoryName("  Hobbies\n")).toBe("Hobbies");
    expect(
      validateCategoryName(createInitialCategories(), "  Hobbies\n"),
    ).toEqual({ ok: true, name: "Hobbies" });
  });

  it.each(["", "   ", "\n\t"])("rejects empty input %#", (name) => {
    expect(validateCategoryName(createInitialCategories(), name)).toEqual({
      ok: false,
      code: "empty",
    });
  });

  it("accepts 24 characters and rejects 25 after trimming", () => {
    expect(
      validateCategoryName(
        createInitialCategories(),
        `  ${"a".repeat(CATEGORY_NAME_MAX_LENGTH)}  `,
      ),
    ).toEqual({ ok: true, name: "a".repeat(CATEGORY_NAME_MAX_LENGTH) });
    expect(
      validateCategoryName(
        createInitialCategories(),
        "a".repeat(CATEGORY_NAME_MAX_LENGTH + 1),
      ),
    ).toEqual({ ok: false, code: "too-long" });
  });

  it.each(["Hobbies", "hObBiEs", " hobbies "])(
    "rejects the case-insensitive duplicate %s",
    (name) => {
      const categories = createCategory(createInitialCategories(), {
        id: "custom-hobbies",
        name: "Hobbies",
      });

      if (!categories.ok) throw new Error("test setup failed");

      expect(validateCategoryName(categories.categories, name)).toEqual({
        ok: false,
        code: "duplicate",
      });
    },
  );

  it("reserves every English and Spanish built-in name independent of current categories", () => {
    const reservedNames = Object.values(builtInCategoryNames).flatMap(
      ({ en, es }) => [en, es],
    );

    for (const name of reservedNames) {
      expect(validateCategoryName([], name.toLocaleUpperCase())).toEqual({
        ok: false,
        code: "reserved",
      });
    }
  });

  it("accepts the tenth category and rejects an eleventh", () => {
    let categories: ReadonlyArray<Category> = createInitialCategories();

    while (categories.length < CATEGORY_LIMIT) {
      const result = createCategory(categories, {
        id: `custom-${categories.length}`,
        name: `Custom ${categories.length}`,
      });
      if (!result.ok) throw new Error("test setup failed");
      categories = result.categories;
    }

    expect(categories).toHaveLength(CATEGORY_LIMIT);
    expect(validateCategoryName(categories, "One too many")).toEqual({
      ok: false,
      code: "limit-reached",
    });
  });
});

describe("category creation", () => {
  it("uses the caller's id, trimmed literal name, and deterministic color", () => {
    const previous = createInitialCategories();
    const result = createCategory(previous, {
      id: "caller-supplied-id",
      name: "  Hobbies  ",
    });

    expect(result).toMatchObject({
      ok: true,
      category: {
        id: "caller-supplied-id",
        kind: "custom",
        name: "Hobbies",
        color: "yellow",
        system: false,
      },
    });
    expect(previous).toEqual(createInitialCategories());
    if (!result.ok) throw new Error("expected category creation to succeed");
    expect(result.categories).not.toBe(previous);
    expect(result.categories.slice(0, previous.length)).toEqual(previous);
    previous.forEach((category, index) => {
      expect(result.categories[index]).toBe(category);
    });
  });

  it("returns the original collection for validation failures", () => {
    const previous = createInitialCategories();
    const result = createCategory(previous, { id: "unused", name: " " });

    expect(result).toEqual({
      ok: false,
      code: "empty",
      categories: previous,
    });
    expect(result.categories).toBe(previous);
  });

  it("cycles through only the non-muted palette deterministically", () => {
    let categories: ReadonlyArray<Category> = createInitialCategories();
    const selectedColors = [];

    for (let index = 0; index < 6; index += 1) {
      selectedColors.push(selectCategoryColor(categories));
      const result = createCategory(categories, {
        id: `category-${index}`,
        name: `Category ${index}`,
      });
      if (!result.ok) throw new Error("test setup failed");
      categories = result.categories;
    }

    expect(selectedColors).toEqual([
      "yellow",
      "blue",
      "coral",
      "purple",
      "teal",
      "yellow",
    ]);
    expect(selectedColors.every((color) => color !== "muted")).toBe(true);
    expect(nonMutedCategoryColorTokens).not.toContain("muted");
  });
});

describe("category deletion", () => {
  it.each(["food", "custom-hobbies"])(
    "deletes the eligible category %s without mutating its input",
    (categoryId) => {
      const created = createCategory(createInitialCategories(), {
        id: "custom-hobbies",
        name: "Hobbies",
      });
      if (!created.ok) throw new Error("test setup failed");
      const previous = created.categories;

      const result = deleteCategory(previous, categoryId);

      expect(result.ok).toBe(true);
      expect(previous).toHaveLength(5);
      if (!result.ok) throw new Error("expected deletion to succeed");
      expect(result.categories).not.toBe(previous);
      expect(result.categories.some(({ id }) => id === categoryId)).toBe(false);
    },
  );

  it("protects Unclassified and returns the unchanged collection", () => {
    const previous = createInitialCategories();
    const result = deleteCategory(previous, "unclassified");

    expect(result).toEqual({
      ok: false,
      code: "protected",
      categories: previous,
    });
    expect(result.categories).toBe(previous);
  });

  it("rejects unknown identifiers and returns the unchanged collection", () => {
    const previous = createInitialCategories();
    const result = deleteCategory(previous, "missing");

    expect(result).toEqual({
      ok: false,
      code: "not-found",
      categories: previous,
    });
    expect(result.categories).toBe(previous);
  });
});
