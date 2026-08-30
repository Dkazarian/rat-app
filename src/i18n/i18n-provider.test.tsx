import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useTranslation } from "react-i18next";

import { renderWithProviders } from "@/test/render";

import { createI18n } from ".";
import { I18nProvider } from "./i18n-provider";

function TranslationConsumer() {
  const { i18n, t } = useTranslation();

  return (
    <div>
      <p>{t("scaffoldTitle")}</p>
      <button
        type="button"
        onClick={() =>
          void i18n.changeLanguage(i18n.language === "en" ? "es" : "en")
        }
      >
        {i18n.language}
      </button>
    </div>
  );
}

describe("i18n", () => {
  it("renders translations and switches the active language", async () => {
    const { user } = renderWithProviders(
      <I18nProvider>
        <TranslationConsumer />
      </I18nProvider>,
    );

    expect(
      screen.getByText("Ratapp is ready for its interface."),
    ).toBeVisible();

    await user.click(screen.getByRole("button", { name: "en" }));

    expect(
      screen.getByText("Ratapp está listo para su interfaz."),
    ).toBeVisible();
    expect(document.documentElement).toHaveAttribute("lang", "es");
  });

  it("falls back to English for an unsupported language", () => {
    const i18n = createI18n("fr");

    expect(i18n.t("scaffoldTitle")).toBe("Ratapp is ready for its interface.");
    expect(i18n.resolvedLanguage).toBe("en");
  });
});
