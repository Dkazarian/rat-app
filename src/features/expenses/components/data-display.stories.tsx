import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useLocale } from "@/i18n/locale-context";

import { ExpenseListItem as ExpenseListItemComponent } from "@/features/expenses/components/expense-list/expense-list-item";
import { CategorySpendingItem as CategorySpendingItemComponent } from "@/features/expenses/components/spending-summary/category-spending-item";
import { SpendingChart as SpendingChartComponent } from "@/features/expenses/components/spending-summary/spending-chart";
import { dashboardFixtures } from "@/features/dashboard/fixtures/dashboard-view-fixtures";

const fixture = dashboardFixtures.success;
const meta = {
  title: "Components/DataDisplay",
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

export const SpendingChart: Story = {
  render: () => (
    <SpendingChartComponent
      totalMinor={fixture.categorySpending.totalMinor}
      items={fixture.categorySpending.items}
    />
  ),
};
export const CategorySpendingItem: Story = {
  render: function LocalizedCategorySpendingItem() {
    return (
      <ul className="w-64 list-none p-0">
        <CategorySpendingItemComponent
          item={fixture.categorySpending.items[0]}
        />
      </ul>
    );
  },
};
export const ExpenseListItem: Story = {
  render: function LocalizedExpenseListItem() {
    const { t } = useLocale();
    return (
      <ul className="w-64 list-none p-0">
        <ExpenseListItemComponent
          expense={{
            ...fixture.expenses[0],
            description: t("lunch"),
          }}
          onDeleteExpense={async () => undefined}
        />
      </ul>
    );
  },
};
