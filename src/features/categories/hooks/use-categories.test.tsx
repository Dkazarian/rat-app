import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CategoryService } from "@/services/categories/category-service";
import { CategoryValidationError } from "@/services/categories/category-errors";
import { useCategories } from "./use-categories";

describe("useCategories", () => {
  it("delegates list, create and delete to the service without passing collections", () => {
    const service = new CategoryService({ createId: () => "health" });
    const create = vi.spyOn(service, "create");
    const remove = vi.spyOn(service, "delete");
    const { result } = renderHook(() => useCategories(service));
    act(() => {
      expect(result.current.createCategory("Health")).toMatchObject({
        id: "health",
        name: "Health",
      });
    });
    expect(create).toHaveBeenCalledWith("Health");
    expect(result.current.categories).toEqual(service.list());
    act(() => {
      result.current.deleteCategory("health");
    });
    expect(remove).toHaveBeenCalledWith("health");
    expect(
      result.current.categories.some((category) => category.id === "health"),
    ).toBe(false);
  });
  it("keeps sequential operations in one event without stale data", () => {
    const service = new CategoryService();
    const { result } = renderHook(() => useCategories(service));
    act(() => {
      const health = result.current.createCategory("Health");
      result.current.createCategory("Books");
      result.current.deleteCategory(health.id);
    });
    expect(result.current.categories).toEqual(service.list());
    expect(result.current.categories).toHaveLength(2);
  });
  it("propagates custom exceptions and preserves the displayed list", () => {
    const service = new CategoryService();
    const { result } = renderHook(() => useCategories(service));
    const previous = result.current.categories;
    act(() => {
      expect(() => result.current.createCategory(" ")).toThrow(
        CategoryValidationError,
      );
    });
    expect(result.current.categories).toBe(previous);
  });
});
