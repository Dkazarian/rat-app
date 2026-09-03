import { afterEach, describe, expect, it, vi } from "vitest";
import { CategoryService } from "./category-service";
import {
  CategoryValidationError,
  DuplicateCategoryIdError,
} from "./category-errors";

afterEach(() => vi.restoreAllMocks());
describe("CategoryService", () => {
  it("lists Unclassified last for every user and isolates users and service instances", () => {
    const service = new CategoryService();
    expect(service.listCategoriesForUser("alice")).toEqual([
      { id: null, kind: "built-in", color: "muted", system: true },
    ]);
    const category = service.create("alice", "Health");
    expect(service.listCategoriesForUser("alice")).toEqual([
      category,
      expect.objectContaining({ id: null }),
    ]);
    expect(service.listCategoriesForUser("bob")).toHaveLength(1);
    expect(new CategoryService().listCategoriesForUser("alice")).toHaveLength(
      1,
    );
  });
  it("finds categories only for their owner and returns undefined when absent or deleted", () => {
    const service = new CategoryService();
    const category = service.create("alice", "Health");
    expect(service.findUserCategoryById("alice", category.id)).toBe(category);
    expect(service.exists("alice", category.id)).toBe(true);
    expect(service.findUserCategoryById("bob", category.id)).toBeUndefined();
    expect(service.exists("bob", category.id)).toBe(false);
    expect(service.exists("unknown", null)).toBe(true);
    expect(service.findUserCategoryById("alice", "missing")).toBeUndefined();
    service.delete("alice", category.id);
    expect(service.findUserCategoryById("alice", category.id)).toBeUndefined();
  });
  it("trims names, generates IDs, and leaves previous list snapshots intact", () => {
    const service = new CategoryService();
    const before = service.listCategoriesForUser("alice");
    const category = service.create("alice", "  Health  ");
    expect(category).toEqual({
      id: expect.any(String),
      kind: "custom",
      name: "Health",
      color: "purple",
      system: false,
    });
    expect(before).toHaveLength(1);
    const list = service.listCategoriesForUser("alice") as Array<unknown>;
    list.pop();
    expect(service.listCategoriesForUser("alice")).toHaveLength(2);
  });
  it.each(["", "   ", "\n\t"])("rejects empty name %j", (name) => {
    const service = new CategoryService();
    expect(() => service.create("alice", name)).toThrow(
      new CategoryValidationError("empty"),
    );
    expect(service.listCategoriesForUser("alice")).toHaveLength(1);
  });
  it("accepts 24 characters after trimming and rejects 25", () => {
    const service = new CategoryService();
    expect(service.create("alice", "  " + "a".repeat(24) + "  ").name).toBe(
      "a".repeat(24),
    );
    expect(() => service.create("alice", "a".repeat(25))).toThrow(
      new CategoryValidationError("too-long"),
    );
  });
  it.each(["Health", "hEaLtH", " health "])(
    "rejects duplicate %s only for the same user",
    (name) => {
      const service = new CategoryService();
      service.create("alice", "Health");
      expect(() => service.create("alice", name)).toThrow(
        new CategoryValidationError("duplicate"),
      );
      expect(service.create("bob", name).name).toBe(name.trim());
      expect(service.listCategoriesForUser("alice")).toHaveLength(2);
    },
  );
  it.each([
    "Food",
    "Comida",
    "Home",
    "Casa",
    "Transport",
    "Transporte",
    "Unclassified",
    "Sin clasificar",
  ])("allows %s as an ordinary custom name", (name) => {
    const service = new CategoryService();
    const category = service.create("alice", name);
    expect(category).toMatchObject({ name, kind: "custom", system: false });
    expect(() => service.create("alice", name.toUpperCase())).toThrow(
      new CategoryValidationError("duplicate"),
    );
    expect(service.delete("alice", category.id)).toBeUndefined();
    expect(service.listCategoriesForUser("alice")).toHaveLength(1);
  });
  it("enforces the per-user limit including Unclassified and cycles colors", () => {
    const service = new CategoryService();
    const categories = Array.from({ length: 9 }, (_, i) =>
      service.create("alice", "Custom " + i),
    );
    expect(categories.map(({ color }) => color)).toEqual([
      "purple",
      "teal",
      "yellow",
      "blue",
      "coral",
      "purple",
      "teal",
      "yellow",
      "blue",
    ]);
    expect(service.listCategoriesForUser("alice")).toHaveLength(10);
    expect(() => service.create("alice", "Too many")).toThrow(
      new CategoryValidationError("limit-reached"),
    );
    expect(service.create("bob", "Independent")).toBeDefined();
    service.delete("alice", categories[0].id);
    expect(service.create("alice", "Room again")).toBeDefined();
  });
  it("deletes only for the specified user and treats missing and system targets as no-ops", () => {
    const service = new CategoryService();
    const category = service.create("alice", "Health");
    const before = service.listCategoriesForUser("alice");
    service.delete("bob", category.id);
    service.delete("alice", "missing");
    service.delete("alice", null);
    expect(service.listCategoriesForUser("alice")).toEqual(before);
    service.delete("alice", category.id);
    service.delete("alice", category.id);
    expect(service.listCategoriesForUser("alice").map(({ id }) => id)).toEqual([
      null,
    ]);
    expect(before[0]).toBe(category);
  });
  it("rejects an ID collision within a user without replacing the existing category", () => {
    vi.spyOn(crypto, "randomUUID").mockReturnValue(
      "10000000-0000-4000-8000-000000000000",
    );
    const service = new CategoryService();
    const first = service.create("alice", "Health");
    expect(() => service.create("alice", "Books")).toThrow(
      DuplicateCategoryIdError,
    );
    expect(service.findUserCategoryById("alice", first.id)).toBe(first);
    const bob = service.create("bob", "Books");
    expect(service.findUserCategoryById("bob", bob.id)).toBe(bob);
  });
});
