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
  | "rate_limited"
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
} as const satisfies Record<
  Exclude<PromptApiErrorCode, "rate_limited">,
  TranslationKey
>;

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

  if (outcome.code === "rate_limited") {
    return { state: "rate-limited" };
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
