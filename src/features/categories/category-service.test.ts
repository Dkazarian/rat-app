import { describe, expect, it } from "vitest";
import {
  CategoryService,
  createInitialCategories,
  builtInCategoryNames,
} from "./category-service";
import {
  CategoryValidationError,
  CategoryNotFoundError,
  ProtectedCategoryError,
  DuplicateCategoryIdError,
} from "./category-errors";

describe("CategoryService", () => {
  it("finds the stored category and throws after that category is deleted", () => {
    const service = new CategoryService({ createId: () => "health" });
    const category = service.create("Health");
    expect(service.find(category.id)).toBe(category);
    service.delete(category.id);
    expect(() => service.find(category.id)).toThrow(
      new CategoryNotFoundError(category.id),
    );
  });

  it("lists built-ins in order and keeps instances independent", () => {
    const first = new CategoryService();
    const second = new CategoryService();
    expect(first.list().map(({ id }) => id)).toEqual([
      "food",
      "home",
      "transport",
      "unclassified",
    ]);
    expect(first.list().at(-1)).toMatchObject({ color: "muted", system: true });
    first.create("Health");
    expect(first.list()).toHaveLength(5);
    expect(second.list()).toHaveLength(4);
  });
  it("creates a trimmed category in its Map and preserves previous lists", () => {
    const service = new CategoryService({ createId: () => "health" });
    const previous = service.list();
    const category = service.create("  Health  ");
    expect(category).toEqual({
      id: "health",
      kind: "custom",
      name: "Health",
      color: "yellow",
      system: false,
    });
    expect(service.list().at(-1)).toBe(category);
    expect(previous).toEqual(createInitialCategories());
  });
  it.each(["", "   ", "\n\t"])(
    "throws a custom exception for empty name %j",
    (name) => {
      const service = new CategoryService();
      expect(() => service.create(name)).toThrow(CategoryValidationError);
      expect(() => service.create(name)).toThrow(
        expect.objectContaining({ code: "empty" }),
      );
      expect(service.list()).toHaveLength(4);
    },
  );
  it("accepts 24 characters and rejects 25 after trimming", () => {
    const service = new CategoryService();
    expect(service.create("  " + "a".repeat(24) + "  ").name).toBe(
      "a".repeat(24),
    );
    expect(() => service.create("a".repeat(25))).toThrow(
      expect.objectContaining({ code: "too-long" }),
    );
  });
  it.each(["Health", "hEaLtH", " health "])("rejects duplicate %s", (name) => {
    const service = new CategoryService();
    service.create("Health");
    expect(() => service.create(name)).toThrow(
      expect.objectContaining({ code: "duplicate" }),
    );
    expect(service.list()).toHaveLength(5);
  });
  it("reserves English and Spanish names even after defaults are deleted", () => {
    const service = new CategoryService({ initialCategories: [] });
    for (const { en, es } of Object.values(builtInCategoryNames)) {
      for (const name of [en, es])
        expect(() => service.create(name.toLocaleUpperCase())).toThrow(
          expect.objectContaining({ code: "reserved" }),
        );
    }
  });
  it("enforces the limit and cycles colored category tokens", () => {
    const service = new CategoryService();
    const colors = Array.from(
      { length: 6 },
      (_, i) => service.create("Custom " + i).color,
    );
    expect(colors).toEqual([
      "yellow",
      "blue",
      "coral",
      "purple",
      "teal",
      "yellow",
    ]);
    expect(service.list()).toHaveLength(10);
    expect(() => service.create("Too many")).toThrow(
      expect.objectContaining({ code: "limit-reached" }),
    );
  });
  it("deletes both eligible built-in and custom categories", () => {
    const service = new CategoryService({ createId: () => "health" });
    service.create("Health");
    for (const id of ["food", "health"]) {
      const previous = service.list();
      expect(service.delete(id).id).toBe(id);
      expect(service.list().some((category) => category.id === id)).toBe(false);
      expect(previous.some((category) => category.id === id)).toBe(true);
    }
  });
  it("throws typed deletion errors without changing the Map", () => {
    const service = new CategoryService();
    expect(() => service.delete("unclassified")).toThrow(
      ProtectedCategoryError,
    );
    expect(() => service.delete("missing")).toThrow(CategoryNotFoundError);
    expect(service.list()).toEqual(createInitialCategories());
  });
  it("does not overwrite an existing Map entry if the ID factory collides", () => {
    const service = new CategoryService({ createId: () => "food" });
    expect(() => service.create("Health")).toThrow(DuplicateCategoryIdError);
    expect(service.list()).toEqual(createInitialCategories());
  });
});
