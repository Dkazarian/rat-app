import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { ExpenseInput as ExpenseInputComponent } from "@/components/capture-panel/expense-input";
import { Mascot as MascotComponent } from "@/components/capture-panel/mascot";
import { RatDialogue as RatDialogueComponent } from "@/components/capture-panel/rat-dialogue";
import { LanguageControl as LanguageControlComponent } from "@/components/header/language-control";
import { getLocale } from "@/i18n";

const meta = {
  title: "Components/Foundations",
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <main className="min-h-screen min-w-[360px] bg-[#18161e] p-6 text-sm text-[#f7f2fa]">
        <Story />
      </main>
    ),
  ],
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const LanguageControl: Story = {
  render: function LocalizedLanguageControl() {
    const { i18n, t } = useTranslation();
    const [locale, setLocale] = useState(
      getLocale(i18n.resolvedLanguage ?? i18n.language),
    );
    return (
      <LanguageControlComponent
        label={t("languageLabel")}
        locale={locale}
        englishLabel={t("english")}
        spanishLabel={t("spanish")}
        onLocaleChange={(next) => {
          setLocale(next);
          void i18n.changeLanguage(next);
        }}
      />
    );
  },
};
export const Mascot: Story = {
  render: function LocalizedMascot() {
    const { t } = useTranslation();
    return (
      <MascotComponent
        src="/assets/rat-mascot.png"
        alt={t("successMascotAlt")}
      />
    );
  },
};
export const AwaitingMascot: Story = {
  render: function LocalizedAwaitingMascot() {
    const { t } = useTranslation();
    return (
      <MascotComponent
        src="/assets/rat-mascot-awaiting.png"
        alt={t("emptyMascotAlt")}
      />
    );
  },
};
export const RatDialogue: Story = {
  render: function LocalizedRatDialogue() {
    const { t } = useTranslation();
    return (
      <RatDialogueComponent
        state="success"
        announcement="polite"
        title={t("successTitle")}
        detail={t("successDetail")}
      />
    );
  },
};
export const ExpenseInput: Story = {
  render: function LocalizedExpenseInput() {
    const { t } = useTranslation();
    return (
      <ExpenseInputComponent
        label={t("inputLabel")}
        placeholder={t("inputPlaceholder")}
        actionLabel={t("sortAction")}
        value={t("sampleInput")}
      />
    );
  },
};
