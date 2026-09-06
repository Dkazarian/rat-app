export const categoryColors = [
  "coral",
  "purple",
  "teal",
  "yellow",
  "blue",
] as const;

export const CATEGORY_NAME_MAX_LENGTH = 24;
export const EXPENSE_PROMPT_MAX_LENGTH = 500;

export type CategoryColor = (typeof categoryColors)[number];

export type CategoryDto = Readonly<{
  id: string;
  name: string;
  color: CategoryColor;
  totalMinor: number;
}>;

export type CategoriesResponse = Readonly<{
  categories: ReadonlyArray<CategoryDto>;
  unclassifiedTotalMinor: number;
  totalMinor: number;
}>;

export type ExpenseDto = Readonly<{
  id: string;
  description: string;
  amountMinor: number;
  categoryId: string | null;
  createdAt: number;
}>;

export type ExpensesResponse = Readonly<{
  expenses: ReadonlyArray<ExpenseDto>;
}>;

export type ApiErrorCode =
  | "invalid_request"
  | "invalid_category_name"
  | "session_not_found"
  | "category_not_found"
  | "category_name_duplicate"
  | "category_limit_reached"
  | "expense_limit_reached"
  | "no_expenses_extracted"
  | "classification_unavailable"
  | "service_unavailable"
  | "internal_error";

export type ApiErrorField = "name" | "prompt";

export type ApiErrorResponse = Readonly<{
  error: Readonly<{
    code: ApiErrorCode;
    message: string;
    field?: ApiErrorField;
  }>;
}>;

export type CategoryMutationResponse = Readonly<{ category: CategoryDto }>;
export type PromptMutationResponse = Readonly<{
  expenses: ReadonlyArray<ExpenseDto>;
  rejectedCount: number;
}>;
