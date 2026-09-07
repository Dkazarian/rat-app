import { describe, expect, it } from "vitest";
import type { PromptMutationResponse } from "@/contracts/session-api";
import { mapPromptOutcomeToRatFeedback } from "./prompt-feedback";

const expense = {
  id: "10000000-0000-4000-8000-000000000001",
  description: "Lunch",
  amountMinor: 1800,
  categoryId: null,
  createdAt: 1,
};

describe("mapPromptOutcomeToRatFeedback", () => {
  it("uses the accepted count and ignores rejectedCount for all successes", () => {
    const response = (rejectedCount: number): PromptMutationResponse => ({
      expenses: [expense],
      rejectedCount,
    });

    expect(
      mapPromptOutcomeToRatFeedback({
        kind: "success",
        response: response(0),
      }),
    ).toEqual(
      mapPromptOutcomeToRatFeedback({
        kind: "success",
        response: response(4),
      }),
    );
    expect(
      mapPromptOutcomeToRatFeedback({
        kind: "success",
        response: response(4),
      }),
    ).toEqual({ state: "success", extractedCount: 1 });
  });

  it.each([
    ["invalid_request", "extraction-failure", "apiErrorInvalidRequest"],
    [
      "no_expenses_extracted",
      "extraction-failure",
      "apiErrorNoExpensesExtracted",
    ],
    ["session_not_found", "provider-error", "apiErrorSessionNotFound"],
    ["expense_limit_reached", "provider-error", "apiErrorExpenseLimitReached"],
    ["service_unavailable", "provider-error", "apiErrorServiceUnavailable"],
    ["internal_error", "provider-error", "apiErrorInternal"],
  ] as const)(
    "maps %s without retaining transport details",
    (code, state, detailKey) => {
      expect(
        mapPromptOutcomeToRatFeedback({ kind: "api-error", code }),
      ).toEqual({
        state,
        detailKey,
      });
    },
  );

  it("maps unknown failures to generic provider feedback", () => {
    expect(mapPromptOutcomeToRatFeedback({ kind: "unknown" })).toEqual({
      state: "provider-error",
      detailKey: "apiErrorUnknown",
    });
  });
});
