import type { ApiErrorCode, ApiErrorField } from "@/contracts/session-api";

export class ApplicationError extends Error {
  constructor(
    readonly code: ApiErrorCode,
    readonly status: number,
    message: string,
    readonly field?: ApiErrorField,
  ) {
    super(message);
    this.name = "ApplicationError";
  }
}

export class RepositoryUnavailableError extends Error {
  constructor(options?: ErrorOptions) {
    super("The session store is unavailable.", options);
    this.name = "RepositoryUnavailableError";
  }
}

export const applicationErrors = {
  invalidRequest: () =>
    new ApplicationError("invalid_request", 400, "The request is invalid."),
  invalidPromptRequest: () =>
    new ApplicationError(
      "invalid_request",
      400,
      "The request is invalid.",
      "prompt",
    ),
  invalidCategoryName: () =>
    new ApplicationError(
      "invalid_category_name",
      400,
      "Enter a category name between 1 and 24 characters.",
      "name",
    ),
  duplicateCategory: () =>
    new ApplicationError(
      "category_name_duplicate",
      409,
      "A category with that name already exists.",
      "name",
    ),
  categoryLimit: () =>
    new ApplicationError(
      "category_limit_reached",
      409,
      "The category limit has been reached.",
      "name",
    ),
  expenseLimit: () =>
    new ApplicationError(
      "expense_limit_reached",
      409,
      "The expense limit has been reached.",
    ),
  noExpensesExtracted: () =>
    new ApplicationError(
      "no_expenses_extracted",
      422,
      "No expenses could be found in that description.",
      "prompt",
    ),
  serviceUnavailable: () =>
    new ApplicationError(
      "service_unavailable",
      503,
      "The service is temporarily unavailable.",
    ),
  internalError: () =>
    new ApplicationError(
      "internal_error",
      500,
      "The request could not be completed.",
    ),
  sessionNotFound: () =>
    new ApplicationError(
      "session_not_found",
      401,
      "The session is unavailable or has expired.",
    ),
  categoryNotFound: () =>
    new ApplicationError(
      "category_not_found",
      404,
      "The category was not found.",
    ),
};
