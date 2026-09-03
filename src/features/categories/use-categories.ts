"use client";
import { useCallback, useState } from "react";
import { categoryService, type CategoryService } from "./category-service";
import type { Category, CategoryId, CustomCategory } from "./types";

export function useCategories(service: CategoryService = categoryService) {
  const [categories, setCategories] = useState(() => service.list());
  const createCategory = useCallback(
    (name: string): CustomCategory => {
      const category = service.create(name);
      setCategories(service.list());
      return category;
    },
    [service],
  );
  const deleteCategory = useCallback(
    (id: CategoryId): Category => {
      const deletedCategory = service.delete(id);
      setCategories(service.list());
      return deletedCategory;
    },
    [service],
  );
  return { categories, createCategory, deleteCategory };
}
