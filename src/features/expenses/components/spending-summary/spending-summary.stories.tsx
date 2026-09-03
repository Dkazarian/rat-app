import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useTranslation } from "react-i18next";

import { dashboardFixtures } from "@/features/dashboard/fixtures/dashboard-view-fixtures";

import { SpendingSummary } from "./spending-summary";
import type { CategorySpendingItemData } from "@/features/expenses/view-types";

const fixture = dashboardFixtures.success;

type StoryProps = Readonly<{
  totalMinor: number;
  items: ReadonlyArray<CategorySpendingItemData>;
  empty?: boolean;
}>;

function LocalizedSpendingSummary({ totalMinor, items, empty }: StoryProps) {
  const { t } = useTranslation();

  const names: Record<string, string> = {
    food: t("food"),
    transport: t("transport"),
    home: t("home"),
    fun: t("fun"),
  };

  return (
    <SpendingSummary
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
    totalMinor: fixture.categorySpending.totalMinor,
    items: fixture.categorySpending.items,
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
    items: dashboardFixtures.empty.categorySpending.items,
    empty: true,
  },
};
