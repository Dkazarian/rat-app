import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderWithProviders } from "@/test/render";

import { LanguageProvider, useLanguage } from "./language-provider";

function LanguageConsumer() {
  const { locale, t, toggleLanguage } = useLanguage();

  return (
    <div>
      <p>{t("scaffoldTitle")}</p>
      <button type="button" onClick={toggleLanguage}>
        {locale}
      </button>
    </div>
  );
}

describe("LanguageProvider", () => {
  it("translates keys and toggles the active locale", async () => {
    const { user } = renderWithProviders(
      <LanguageProvider>
        <LanguageConsumer />
      </LanguageProvider>,
    );

    expect(
      screen.getByText("Ratapp is ready for its interface."),
    ).toBeVisible();

    await user.click(screen.getByRole("button", { name: "en" }));

    expect(
      screen.getByText("Ratapp está listo para su interfaz."),
    ).toBeVisible();
  });
});
