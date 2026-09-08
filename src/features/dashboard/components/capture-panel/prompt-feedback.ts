import type {
  PromptMutationResponse,
  ApiErrorCode,
} from "@/contracts/session-api";
import type { TranslationKey } from "@/i18n";
import type { RatDialogueFeedback } from "./rat-dialogue";

export type PromptApiErrorCode = Extract<
  ApiErrorCode,
  | "invalid_request"
  | "session_not_found"
  | "expense_limit_reached"
  | "no_expenses_extracted"
  | "service_unavailable"
  | "internal_error"
>;

export type PromptApiOutcome =
  | Readonly<{ kind: "success"; response: PromptMutationResponse }>
  | Readonly<{ kind: "api-error"; code: PromptApiErrorCode }>
  | Readonly<{ kind: "unknown" }>;

const detailKeys = {
  invalid_request: "apiErrorInvalidRequest",
  session_not_found: "apiErrorSessionNotFound",
  expense_limit_reached: "apiErrorExpenseLimitReached",
  no_expenses_extracted: "apiErrorNoExpensesExtracted",
  service_unavailable: "apiErrorServiceUnavailable",
  internal_error: "apiErrorInternal",
} as const satisfies Record<PromptApiErrorCode, TranslationKey>;

export function mapPromptOutcomeToRatFeedback(
  outcome: PromptApiOutcome,
): RatDialogueFeedback {
  if (outcome.kind === "success") {
    return {
      state: "success",
      extractedCount: outcome.response.expenses.length,
    };
  }

  if (outcome.kind === "unknown") {
    return { state: "provider-error", detailKey: "apiErrorUnknown" };
  }

  return {
    state:
      outcome.code === "invalid_request" ||
      outcome.code === "no_expenses_extracted"
        ? "extraction-failure"
        : "provider-error",
    detailKey: detailKeys[outcome.code],
  };
}
