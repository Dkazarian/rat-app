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
  render: () => <MascotComponent state="success" />,
};
export const AwaitingMascot: Story = {
  render: () => <MascotComponent state="empty" />,
};
export const RatDialogue: Story = {
  render: () => (
    <RatDialogueComponent
      feedback={{ state: "success", extractedCount: 3, rejectedCount: 0 }}
    />
  ),
};
export const ExpenseInput: Story = {
  render: function LocalizedExpenseInput() {
    const { t } = useLocale();
    return <ExpenseInputComponent value={t("sampleInput")} />;
  },
};
