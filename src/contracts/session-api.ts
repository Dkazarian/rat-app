import { z } from "zod";

export const categoryColors = [
  "coral",
  "purple",
  "teal",
  "yellow",
  "blue",
] as const;

export const CATEGORY_NAME_MAX_LENGTH = 24;
export const EXPENSE_DESCRIPTION_MAX_LENGTH = 120;
export const EXPENSE_PROMPT_MAX_LENGTH = 500;

export type CategoryColor = (typeof categoryColors)[number];

export type CategoryDto = Readonly<{
  id: string;
  name: string;
  color: CategoryColor;
  totalMinor: number;
}>;

export const expenseDtoSchema = z
  .object({
    id: z.uuid(),
    description: z.string().trim().min(1).max(EXPENSE_DESCRIPTION_MAX_LENGTH),
    amountMinor: z.number().int().safe().positive(),
    categoryId: z.uuid().nullable(),
    createdAt: z.number().int().safe().nonnegative(),
  })
  .strict();

export const promptMutationResponseSchema = z
  .object({
    expenses: z.array(expenseDtoSchema).min(1),
    rejectedCount: z.number().int().safe().nonnegative(),
  })
  .strict();

export type CategoriesResponse = Readonly<{
  categories: ReadonlyArray<CategoryDto>;
  unclassifiedTotalMinor: number;
  totalMinor: number;
}>;

export type ExpenseDto = z.infer<typeof expenseDtoSchema>;

export type ExpensesResponse = Readonly<{
  expenses: ReadonlyArray<ExpenseDto>;
}>;

export const apiErrorCodeSchema = z.enum([
  "invalid_request",
  "invalid_category_name",
  "session_not_found",
  "category_not_found",
  "category_name_duplicate",
  "category_limit_reached",
  "expense_limit_reached",
  "rate_limited",
  "no_expenses_extracted",
  "service_unavailable",
  "internal_error",
]);

export type ApiErrorCode = z.infer<typeof apiErrorCodeSchema>;

export type ApiErrorField = "name" | "prompt";

export type ApiErrorResponse = Readonly<{
  error: Readonly<{
    code: ApiErrorCode;
    message: string;
    field?: ApiErrorField;
  }>;
}>;

export const apiErrorResponseSchema = z
  .object({
    error: z
      .object({
        code: apiErrorCodeSchema,
        message: z.string().min(1),
        field: z.enum(["name", "prompt"]).optional(),
      })
      .strict(),
  })
  .strict();

export const promptErrorResponseSchema = z
  .object({
    error: z
      .object({
        code: z.enum([
          "invalid_request",
          "session_not_found",
          "expense_limit_reached",
          "rate_limited",
          "no_expenses_extracted",
          "service_unavailable",
          "internal_error",
        ]),
        message: z.string().min(1),
        field: z.literal("prompt").optional(),
      })
      .strict(),
  })
  .strict();

export type CategoryMutationResponse = Readonly<{ category: CategoryDto }>;
export type PromptMutationResponse = z.infer<
  typeof promptMutationResponseSchema
>;
