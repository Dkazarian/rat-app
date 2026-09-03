import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderWithProviders } from "@/test/render";

import { createI18n } from ".";
import { I18nProvider } from "./i18n-provider";
import { useLocale } from "./locale-context";

function TranslationConsumer() {
  const { locale, t, changeLocale } = useLocale();

  return (
    <div>
      <p>{t("scaffoldTitle")}</p>
      <button
        type="button"
        onClick={() => void changeLocale(locale === "en" ? "es" : "en")}
      >
        {locale}
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

    await user.click(screen.getByRole("button", { name: "es" }));

    expect(screen.getByRole("button", { name: "en" })).toBeVisible();
    expect(
      screen.getByText("Ratapp is ready for its interface."),
    ).toBeVisible();
    expect(document.documentElement).toHaveAttribute("lang", "en");
  });

  it("falls back to English for an unsupported language", () => {
    const i18n = createI18n("fr");

    expect(i18n.t("scaffoldTitle")).toBe("Ratapp is ready for its interface.");
    expect(i18n.resolvedLanguage).toBe("en");
  });
});
