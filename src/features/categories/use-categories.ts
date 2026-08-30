"use client";

import { useCallback, useState } from "react";

import {
  createCategory as createCategoryValue,
  createInitialCategories,
  deleteCategory as deleteCategoryValue,
} from "./category-rules";
import type {
  Category,
  CategoryCreationResult,
  CategoryDeletionResult,
  CategoryId,
} from "./types";

export type CategoryIdFactory = () => CategoryId;

export type CategoriesSession = Readonly<{
  categories: ReadonlyArray<Category>;
  createCategory: (name: string) => CategoryCreationResult;
  deleteCategory: (categoryId: CategoryId) => CategoryDeletionResult;
}>;

function createBrowserCategoryId(): CategoryId {
  return crypto.randomUUID();
}

export function useCategories(
  createId: CategoryIdFactory = createBrowserCategoryId,
): CategoriesSession {
  const [categories, setCategories] = useState<ReadonlyArray<Category>>(
    createInitialCategories,
  );

  const createCategory = useCallback(
    (name: string) => {
      const result = createCategoryValue(categories, {
        id: createId(),
        name,
      });

      if (result.ok) setCategories(result.categories);

      return result;
    },
    [categories, createId],
  );

  const deleteCategory = useCallback(
    (categoryId: CategoryId) => {
      const result = deleteCategoryValue(categories, categoryId);

      if (result.ok) setCategories(result.categories);

      return result;
    },
    [categories],
  );

  return { categories, createCategory, deleteCategory };
}
