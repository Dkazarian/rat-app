"use client";
import { useCallback, useState } from "react";
import {
  categoryService,
  type CategoryService,
} from "@/services/categories/category-service";
import type {
  Category,
  CategoryId,
  CustomCategory,
} from "@/services/categories/types";

export function useCategories(service: CategoryService = categoryService) {
  const [categories, setCategories] = useState(() => service.list());
  const createCategory = useCallback(
    (name: string): CustomCategory => {
      const category = service.create(name);
      setCategories(categories => [...categories, category]);
      return category;
    },
    [service],
  );
  const deleteCategory = useCallback(
    (id: CategoryId): Category => {
      const deletedCategory = service.delete(id);
      setCategories(categories => categories.filter((c) => c.id !== id));
      return deletedCategory;
    },
    [service],
  );
  return { categories, createCategory, deleteCategory };
}
