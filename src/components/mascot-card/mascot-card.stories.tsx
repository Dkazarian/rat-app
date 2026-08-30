import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useTranslation } from "react-i18next";

import { MascotCard } from "./mascot-card";

function LocalizedMascotCard() {
  const { t } = useTranslation();

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
