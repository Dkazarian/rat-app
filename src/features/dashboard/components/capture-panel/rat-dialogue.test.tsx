import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { I18nProvider } from "@/i18n/i18n-provider";
import { SessionApiError } from "@/features/dashboard/api/session-api-client";
import { RatDialogue } from "./rat-dialogue";

function renderDialogue(
  feedback: Parameters<typeof RatDialogue>[0]["feedback"],
) {
  return render(
    <I18nProvider>
      <RatDialogue feedback={feedback} />
    </I18nProvider>,
  );
}

describe("RatDialogue", () => {
  it("derives polite, count-dependent success feedback", () => {
    renderDialogue({ state: "success", extractedCount: 1, rejectedCount: 2 });

    expect(screen.getByText("Done").parentElement).toHaveAttribute(
      "aria-live",
      "polite",
    );
    expect(screen.getByText(/1 expense sorted/)).toHaveTextContent(
      "1 expense sorted. 2 skipped.",
    );
  });

  it("derives an alert and localized API detail for errors", () => {
    renderDialogue({
      state: "provider-error",
      error: new SessionApiError("service_unavailable", "Server text"),
    });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "The service is temporarily unavailable. Try again.",
    );
  });
});
