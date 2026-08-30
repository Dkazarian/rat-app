import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { getLocale } from "@/i18n";
import type { SpendingCategoryPercentItemData } from "@/types/presentation";
import { useTranslation } from "react-i18next";

import { dashboardFixtures } from "@/fixtures/dashboard-fixtures";

import { SpendingSummary } from "./spending-summary";

const fixture = dashboardFixtures.success;

type StoryProps = Readonly<{
  totalMinor: number;
  items: ReadonlyArray<SpendingCategoryPercentItemData>;
  empty?: boolean;
}>;

function LocalizedSpendingSummary({ totalMinor, items, empty }: StoryProps) {
  const { i18n, t } = useTranslation();
  const locale = getLocale(i18n.resolvedLanguage ?? i18n.language);
  const names: Record<string, string> = {
    food: t("food"),
    transport: t("transport"),
    home: t("home"),
    fun: t("fun"),
  };

  return (
    <SpendingSummary
      locale={locale}
      title={t("spending")}
      periodLabel={t("thisMonth")}
      totalLabel={t("total")}
      totalMinor={totalMinor}
      chartLabel={empty ? t("noSpending") : t("chartLabel")}
      items={items.map((item) => ({
        ...item,
        name: names[item.categoryId] ?? t("categories"),
      }))}
    />
  );
}

const meta = {
  title: "Components/SpendingSummary",
  component: LocalizedSpendingSummary,
  args: {
    totalMinor: fixture.spending.totalMinor,
    items: fixture.spending.items,
  },
  decorators: [
    (Story) => (
      <main className="min-h-screen bg-[#26222d] p-6 text-sm text-[#f7f2fa]">
        <Story />
      </main>
    ),
  ],
} satisfies Meta<typeof LocalizedSpendingSummary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Populated: Story = {};
export const Empty: Story = {
  args: {
    totalMinor: 0,
    items: dashboardFixtures.empty.spending.items,
    empty: true,
  },
};
