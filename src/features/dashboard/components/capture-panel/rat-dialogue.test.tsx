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
      "The service is temporarily unavailable. Try again.",
    );
  });

  it("announces concise rate-limit feedback", () => {
    renderDialogue({ state: "rate-limited" });
    expect(screen.getByRole("alert")).toHaveTextContent(
      "AI is tiredTry again later.",
    );
  });

  it.each([
    ["en", "Session expired. Continue to start fresh."],
    ["es", "La sesión venció. Continuá para empezar de nuevo."],
  ] as const)("renders session expiration feedback in %s", (locale, text) => {
    renderDialogue(
      { state: "provider-error", detailKey: "apiErrorSessionNotFound" },
      locale,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(text);
    expect(screen.getByRole("alert")).toHaveAttribute(
      "data-state",
      "provider-error",
    );
  });
});
