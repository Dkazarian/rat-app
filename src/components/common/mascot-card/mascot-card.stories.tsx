import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useLocale } from "@/i18n/locale-context";

import { MascotCard } from "./mascot-card";

function LocalizedMascotCard() {
  const { t } = useLocale();

  return (
    <MascotCard
      eyebrow={t("scaffoldEyebrow")}
      title={t("scaffoldTitle")}
      description={t("scaffoldDescription")}
    />
  );
}

const meta = {
  title: "Foundation/MascotCard",
  component: LocalizedMascotCard,
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <main className="grid min-h-screen place-items-center bg-amber-50 p-6">
        <Story />
      </main>
    ),
  ],
} satisfies Meta<typeof LocalizedMascotCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
