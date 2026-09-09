import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { I18nProvider } from "@/i18n/i18n-provider";
import { RatDialogue } from "./rat-dialogue";

function renderDialogue(
  feedback: Parameters<typeof RatDialogue>[0]["feedback"],
  initialLocale: "en" | "es" = "en",
) {
  return render(
    <I18nProvider initialLocale={initialLocale}>
      <RatDialogue feedback={feedback} />
    </I18nProvider>,
  );
}

describe("RatDialogue", () => {
  it("derives polite, count-dependent success feedback", () => {
    renderDialogue({ state: "success", extractedCount: 1 });

    expect(screen.getByText("Done").parentElement).toHaveAttribute(
      "aria-live",
      "polite",
    );
    expect(screen.getByText(/1 expense sorted/)).toHaveTextContent(
      "1 expense sorted.",
    );
  });

  it("derives an alert and localized API detail for errors", () => {
    renderDialogue({
      state: "provider-error",
      detailKey: "apiErrorServiceUnavailable",
    });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Service unavailable. Try again.",
    );
  });

  it("renders concise session-expiration feedback", () => {
    renderDialogue({
      state: "provider-error",
      detailKey: "apiErrorSessionNotFound",
    });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Session expired. Continue to start fresh.",
    );
  });

  it("keeps the expense-limit reason without the numeric aside", () => {
    renderDialogue({
      state: "provider-error",
      detailKey: "apiErrorExpenseLimitReached",
    });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "This session reached its expense limit.",
    );
    expect(screen.getByRole("alert")).not.toHaveTextContent("100 expenses");
  });

  it("keeps extraction failure urgent with Spanish copy", () => {
    renderDialogue(
      {
        state: "extraction-failure",
        detailKey: "apiErrorNoExpensesExtracted",
      },
      "es",
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Incluí qué compraste y el monto.",
    );
  });

  it("announces concise rate-limit feedback", () => {
    renderDialogue({ state: "rate-limited" });
    expect(screen.getByRole("alert")).toHaveTextContent(
      "AI is tiredTry again later.",
    );
  });
});
