import { describe, expect, it } from "vitest";
import { CategoryService } from "./category-service";
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

  it("starts with only Unclassified and keeps instances independent", () => {
    const first = new CategoryService();
    const second = new CategoryService();
    expect(first.list().map(({ id }) => id)).toEqual(["unclassified"]);
    expect(first.list().at(-1)).toMatchObject({ color: "muted", system: true });
    first.create("Health");
    expect(first.list()).toHaveLength(2);
    expect(second.list()).toHaveLength(1);
  });
  it("creates a trimmed category in its Map and preserves previous lists", () => {
    const service = new CategoryService({ createId: () => "health" });
    const previous = service.list();
    const category = service.create("  Health  ");
    expect(category).toEqual({
      id: "health",
      kind: "custom",
      name: "Health",
      color: "coral",
      system: false,
    });
    expect(service.list().at(-1)).toBe(category);
    expect(previous.map(({ id }) => id)).toEqual(["unclassified"]);
  });
  it.each(["", "   ", "\n\t"])(
    "throws a custom exception for empty name %j",
    (name) => {
      const service = new CategoryService();
      expect(() => service.create(name)).toThrow(CategoryValidationError);
      expect(() => service.create(name)).toThrow(
        expect.objectContaining({ code: "empty" }),
      );
      expect(service.list()).toHaveLength(1);
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
    expect(service.list()).toHaveLength(2);
  });
  it.each(["Food", "Comida", "Home", "Casa", "Transport", "Transporte"])(
    "allows the former built-in name %s as an ordinary custom category",
    (name) => {
      const service = new CategoryService();
      const category = service.create(name);
      expect(category).toMatchObject({ name, kind: "custom", system: false });
      expect(() => service.create(name.toUpperCase())).toThrow(
        expect.objectContaining({ code: "duplicate" }),
      );
      expect(service.delete(category.id)).toEqual(category);
    },
  );
  it.each(["Unclassified", "Sin clasificar"])(
    "reserves the system category name %s",
    (name) => {
      const service = new CategoryService();
      expect(() => service.create(`  ${name.toUpperCase()}  `)).toThrow(
        expect.objectContaining({ code: "reserved" }),
      );
    },
  );
  it("enforces the limit and cycles colored category tokens", () => {
    const service = new CategoryService();
    const colors = Array.from(
      { length: 9 },
      (_, i) => service.create("Custom " + i).color,
    );
    expect(colors).toEqual([
      "coral",
      "purple",
      "teal",
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
  it("deletes custom categories while preserving previous lists", () => {
    const service = new CategoryService({ createId: () => "health" });
    service.create("Health");
    const previous = service.list();
    expect(service.delete("health").id).toBe("health");
    expect(service.list().some(({ id }) => id === "health")).toBe(false);
    expect(previous.some(({ id }) => id === "health")).toBe(true);
  });
  it("throws typed deletion errors without changing the Map", () => {
    const service = new CategoryService();
    expect(() => service.delete("unclassified")).toThrow(
      ProtectedCategoryError,
    );
    expect(() => service.delete("missing")).toThrow(CategoryNotFoundError);
    expect(service.list().map(({ id }) => id)).toEqual(["unclassified"]);
  });
  it("does not overwrite an existing Map entry if the ID factory collides", () => {
    const service = new CategoryService({ createId: () => "unclassified" });
    expect(() => service.create("Health")).toThrow(DuplicateCategoryIdError);
    expect(service.list().map(({ id }) => id)).toEqual(["unclassified"]);
  });
  it("includes Unclassified even when the seed omits it", () => {
    const service = new CategoryService({ initialCategories: [] });
    expect(service.list()).toEqual([
      {
        id: "unclassified",
        kind: "built-in",
        color: "muted",
        system: true,
      },
    ]);
  });
});
