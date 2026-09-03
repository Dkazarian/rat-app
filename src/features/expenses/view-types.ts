import type {
  CategoryColorToken,
  CategoryId,
} from "@/services/categories/types";
import type { ExpenseId } from "@/services/expenses/types";

export type ExpenseListItemData = Readonly<{
  id: ExpenseId;
  description: string;
  categoryId: string;
  categoryName: string;
  color: CategoryColorToken;
  amountMinor: number;
}>;

export type ExpenseCategoryOption = Readonly<{
  id: CategoryId;
  name: string;
}>;

export type CategorySpendingItemData = Readonly<{
  categoryId: string;
  name: string;
  color: CategoryColorToken;
  percent: number;
}>;
