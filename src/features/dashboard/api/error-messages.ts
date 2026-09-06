import type { TFunction } from "i18next";
import type { ApiErrorCode } from "@/contracts/session-api";
import type { TranslationKey } from "@/i18n";
import { SessionApiError } from "./session-api-client";

const errorKeys = {
  invalid_request: "apiErrorInvalidRequest",
  invalid_category_name: "apiErrorInvalidCategoryName",
  session_not_found: "apiErrorSessionNotFound",
  category_not_found: "apiErrorCategoryNotFound",
  category_name_duplicate: "apiErrorCategoryNameDuplicate",
  category_limit_reached: "apiErrorCategoryLimitReached",
  expense_limit_reached: "apiErrorExpenseLimitReached",
  no_expenses_extracted: "apiErrorNoExpensesExtracted",
  classification_unavailable: "apiErrorClassificationUnavailable",
  service_unavailable: "apiErrorServiceUnavailable",
  internal_error: "apiErrorInternal",
} as const satisfies Record<ApiErrorCode, TranslationKey>;

export function getApiErrorMessage(error: unknown, t: TFunction): string {
  return error instanceof SessionApiError
    ? t(errorKeys[error.code])
    : t("apiErrorUnknown");
}
