import type {
  Category,
  CategoryColorToken,
  CategoryId,
} from "@/services/categories/types";
import type { ExpenseValidationError } from "./expense-errors";

export type ExpenseId = string;
export type ExpenseDescription = string;
export type ExpenseAmountMinor = number;

export type Expense = Readonly<{
  id: ExpenseId;
  description: ExpenseDescription;
  amountMinor: ExpenseAmountMinor;
  categoryId: CategoryId;
}>;

export type ExpenseCandidate = Readonly<{
  id: ExpenseId;
  description: ExpenseDescription;
  amountMinor: ExpenseAmountMinor;
  categoryId?: CategoryId;
}>;

export const expenseBatchRejectionCodes = [
  "invalid-description",
  "invalid-amount",
  "duplicate-id",
] as const;

export type ExpenseBatchRejectionCode =
  (typeof expenseBatchRejectionCodes)[number];

export type ExpenseBatchError = Readonly<{
  candidate: ExpenseCandidate;
  error: ExpenseValidationError;
}>;

export type ExpenseBatchAdditionResult = Readonly<{
  added: ReadonlyArray<Expense>;
  errors: ReadonlyArray<ExpenseBatchError>;
}>;

export type ExpenseReclassificationResult = Expense;

export type CategorizedExpenseGroup = Readonly<{
  category: Category;
  expenses: ReadonlyArray<Expense>;
  totalMinor: number;
  percent: number;
}>;

export type ExpenseChartSlice = Readonly<{
  categoryId: CategoryId;
  color: CategoryColorToken;
  totalMinor: number;
  percent: number;
}>;

export type ExpenseSummary = Readonly<{
  totalMinor: number;
  groups: ReadonlyArray<CategorizedExpenseGroup>;
  chartSlices: ReadonlyArray<ExpenseChartSlice>;
}>;
