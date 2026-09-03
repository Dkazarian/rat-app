import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useLocale } from "@/i18n/locale-context";

import { Header } from "./header";

function LocalizedHeader() {
  const { t } = useLocale();

  return <Header appName={t("appName")} />;
}

const meta = {
  title: "Components/Header",
  component: LocalizedHeader,
} satisfies Meta<typeof LocalizedHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
