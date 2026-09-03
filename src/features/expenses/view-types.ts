import type {
  CategoryColorToken,
  CategoryId,
} from "@/services/categories/types";
import type { ExpenseId } from "@/services/expenses/types";

export type ExpenseListItemData = Readonly<{
  id: ExpenseId;
  description: string;
  categoryId: CategoryId;
  categoryName: string;
  color: CategoryColorToken;
  amountMinor: number;
}>;

export type ExpenseCategoryOption = Readonly<{
  id: CategoryId;
  name: string;
}>;

export type CategorySpendingItemData = Readonly<{
  categoryId: CategoryId;
  name: string;
  color: CategoryColorToken;
  percent: number;
}>;
