import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { I18nProvider } from "@/i18n/i18n-provider";
import { renderWithProviders } from "@/test/render";
import { Mascot } from "./mascot";

describe("Mascot", () => {
  it("uses the tired asset and localized alternative text when rate limited", () => {
    renderWithProviders(
      <I18nProvider>
        <Mascot state="rate-limited" />
      </I18nProvider>,
    );
    const image = screen.getByRole("img", { name: "Tired rat mascot" });
    expect(image).toHaveAttribute(
      "src",
      expect.stringContaining("rat-mascot-tired.png"),
    );
  });
});
