import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useLocale } from "@/i18n/locale-context";

import { ExpenseInput as ExpenseInputComponent } from "@/features/dashboard/components/capture-panel/expense-input";
import { Mascot as MascotComponent } from "@/features/dashboard/components/capture-panel/mascot";
import { RatDialogue as RatDialogueComponent } from "@/features/dashboard/components/capture-panel/rat-dialogue";
import { LanguageControl as LanguageControlComponent } from "@/components/layout/header/language-control";

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
  render: () => <LanguageControlComponent />,
};
export const Mascot: Story = {
  render: function LocalizedMascot() {
    const { t } = useLocale();
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
    const { t } = useLocale();
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
    const { t } = useLocale();
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
    const { t } = useLocale();
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
