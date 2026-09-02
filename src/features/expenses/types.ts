import type {
  Category,
  CategoryColorToken,
  CategoryId,
} from "@/features/categories/types";

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
  "empty-batch",
  "invalid-description",
  "invalid-amount",
] as const;

export type ExpenseBatchRejectionCode =
  (typeof expenseBatchRejectionCodes)[number];

export type ExpenseBatchAdditionResult =
  | Readonly<{
      ok: true;
      addedExpenses: ReadonlyArray<Expense>;
      expenses: ReadonlyArray<Expense>;
    }>
  | Readonly<{
      ok: false;
      code: ExpenseBatchRejectionCode;
      expenses: ReadonlyArray<Expense>;
    }>;

export const expenseReclassificationRejectionCodes = [
  "expense-not-found",
  "category-not-found",
] as const;

export type ExpenseReclassificationRejectionCode =
  (typeof expenseReclassificationRejectionCodes)[number];

export type ExpenseReclassificationResult =
  | Readonly<{
      ok: true;
      expense: Expense;
      expenses: ReadonlyArray<Expense>;
    }>
  | Readonly<{
      ok: false;
      code: ExpenseReclassificationRejectionCode;
      expenses: ReadonlyArray<Expense>;
    }>;

export type ExpenseDeletionResult =
  | Readonly<{
      ok: true;
      deletedExpense: Expense;
      expenses: ReadonlyArray<Expense>;
    }>
  | Readonly<{
      ok: false;
      code: "expense-not-found";
      expenses: ReadonlyArray<Expense>;
    }>;

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
