import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CategoryService } from "@/services/categories/category-service";
import { CategoryValidationError } from "@/services/categories/category-errors";
import { useCategories } from "./use-categories";

describe("useCategories", () => {
  it("passes the user ID to list, create, and delete and keeps Unclassified last", () => {
    const service = new CategoryService();
    const create = vi.spyOn(service, "create");
    const remove = vi.spyOn(service, "delete");
    const { result } = renderHook(() => useCategories("alice", service));
    let categoryId = "";
    act(() => {
      categoryId = result.current.createCategory("Health").id;
    });
    expect(create).toHaveBeenCalledWith("alice", "Health");
    expect(result.current.categories).toEqual(
      service.listCategoriesForUser("alice"),
    );
    expect(result.current.categories.at(-1)?.id).toBeNull();
    act(() => {
      result.current.deleteCategory(categoryId);
    });
    expect(remove).toHaveBeenCalledWith("alice", categoryId);
    expect(result.current.categories.map(({ id }) => id)).toEqual([null]);
  });
  it("keeps sequential operations in one event without stale data", () => {
    const service = new CategoryService();
    const { result } = renderHook(() => useCategories("alice", service));
    act(() => {
      const health = result.current.createCategory("Health");
      result.current.createCategory("Books");
      result.current.deleteCategory(health.id);
    });
    expect(result.current.categories).toEqual(
      service.listCategoriesForUser("alice"),
    );
    expect(result.current.categories).toHaveLength(2);
  });
  it("propagates validation errors and preserves the displayed snapshot", () => {
    const service = new CategoryService();
    const { result } = renderHook(() => useCategories("alice", service));
    const previous = result.current.categories;
    act(() => {
      expect(() => result.current.createCategory(" ")).toThrow(
        CategoryValidationError,
      );
    });
    expect(result.current.categories).toBe(previous);
  });
  it("keeps missing and system deletions harmless", () => {
    const service = new CategoryService();
    const { result } = renderHook(() => useCategories("alice", service));
    act(() => {
      result.current.deleteCategory(null);
      result.current.deleteCategory("missing");
    });
    expect(result.current.categories.map(({ id }) => id)).toEqual([null]);
  });
  it("shows only the selected user's categories after switching users", () => {
    const service = new CategoryService();
    const alice = service.create("alice", "Health");
    const bob = service.create("bob", "Books");
    const { result, rerender } = renderHook(
      ({ userId }) => useCategories(userId, service),
      { initialProps: { userId: "alice" } },
    );
    expect(result.current.categories[0]).toBe(alice);
    rerender({ userId: "bob" });
    expect(result.current.categories[0]).toBe(bob);
    act(() => {
      result.current.deleteCategory(alice.id);
    });
    expect(service.exists("alice", alice.id)).toBe(true);
    expect(result.current.categories[0]).toBe(bob);
  });
});
