import type { CategoryColorToken } from "@/features/categories/category-color";

export type ExpenseListItemData = Readonly<{
  id: string;
  description: string;
  categoryName: string;
  color: CategoryColorToken;
  amountMinor: number;
}>;

export type CategorySpendingItemData = Readonly<{
  categoryId: string | null;
  name: string;
  color: CategoryColorToken;
  percent: number;
}>;
