import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { getLocale } from "@/i18n";
import { useTranslation } from "react-i18next";

import { Header } from "./header";

function LocalizedHeader() {
  const { i18n, t } = useTranslation();
  const locale = getLocale(i18n.resolvedLanguage ?? i18n.language);

  return (
    <Header
      appName={t("appName")}
      languageControl={{
        label: t("languageLabel"),
        locale,
        englishLabel: t("english"),
        spanishLabel: t("spanish"),
        onLocaleChange: (nextLocale) => {
          void i18n.changeLanguage(nextLocale);
        },
      }}
    />
  );
}

const meta = {
  title: "Components/Header",
  component: LocalizedHeader,
} satisfies Meta<typeof LocalizedHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
