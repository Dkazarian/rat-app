"use client";
import { useCallback, useState } from "react";
import {
  categoryService,
  type CategoryService,
} from "@/services/categories/category-service";
import type { CategoryId, CustomCategory } from "@/services/categories/types";
import type { UserId } from "@/services/users/types";

export function useCategories(
  userId: UserId,
  service: CategoryService = categoryService,
) {
  const [snapshot, setSnapshot] = useState(() => ({
    service,
    userId,
    categories: service.listCategoriesForUser(userId),
  }));
  if (snapshot.service !== service || snapshot.userId !== userId) {
    setSnapshot({
      service,
      userId,
      categories: service.listCategoriesForUser(userId),
    });
  }
  const createCategory = useCallback(
    (name: string): CustomCategory => {
      const category = service.create(userId, name);
      setSnapshot({
        service,
        userId,
        categories: service.listCategoriesForUser(userId),
      });
      return category;
    },
    [service, userId],
  );
  const deleteCategory = useCallback(
    (id: CategoryId): void => {
      service.delete(userId, id);
      setSnapshot({
        service,
        userId,
        categories: service.listCategoriesForUser(userId),
      });
    },
    [service, userId],
  );
  return { categories: snapshot.categories, createCategory, deleteCategory };
}
