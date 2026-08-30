"use client";

import { useState } from "react";

import type {
  RatDialogueData,
  RatDialogueState,
} from "@/components/capture-panel/rat-dialogue";
import type { ExpenseListItemData } from "@/components/expense-list/expense-list-item";
import type { CategorySpendingItemData } from "@/components/spending-summary/category-spending-item";
import { useCategories } from "@/features/categories/use-categories";
import { dashboardFixtures } from "@/fixtures/dashboard-fixtures";

export type ExpenseSessionSeed = Readonly<{
  id: RatDialogueState;
  inputValue: string;
  feedback: RatDialogueData;
  categorySpending: Readonly<{
    totalMinor: number;
    items: ReadonlyArray<CategorySpendingItemData>;
  }>;
  expenses: ReadonlyArray<ExpenseListItemData>;
}>;

export function useExpenseSession(
  seed: ExpenseSessionSeed = dashboardFixtures.empty,
) {
  const categories = useCategories();
  const [expenseState] = useState(() => ({
    feedbackState: seed.id,
    inputValue: seed.inputValue,
    feedback: seed.feedback,
    categorySpending: seed.categorySpending,
    expenses: seed.expenses,
  }));

  return { ...expenseState, ...categories };
}
