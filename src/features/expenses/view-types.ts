import type { CategoryColorToken } from "@/features/categories/category-color";

export type ExpenseListItemData = Readonly<{
  id: string;
  description: string;
  categoryId: string | null;
  categoryName: string;
  color: CategoryColorToken;
  amountMinor: number;
}>;

export type ExpenseCategoryOption = Readonly<{
  id: string | null;
  name: string;
}>;

export type CategorySpendingItemData = Readonly<{
  categoryId: string | null;
  name: string;
  color: CategoryColorToken;
  percent: number;
}>;
