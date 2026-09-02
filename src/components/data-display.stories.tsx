import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useTranslation } from "react-i18next";

import { ExpenseListItem as ExpenseListItemComponent } from "@/components/expense-list/expense-list-item";
import { CategorySpendingItem as CategorySpendingItemComponent } from "@/components/spending-summary/category-spending-item";
import { SpendingChart as SpendingChartComponent } from "@/components/spending-summary/spending-chart";
import { getLocale } from "@/i18n";
import { dashboardFixtures } from "@/fixtures/dashboard-fixtures";

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
  render: function LocalizedSpendingChart() {
    const { i18n, t } = useTranslation();
    const locale = getLocale(i18n.resolvedLanguage ?? i18n.language);
    const names = {
      food: t("food"),
      transport: t("transport"),
      home: t("home"),
      fun: t("fun"),
    };
    return (
      <SpendingChartComponent
        label={t("chartLabel")}
        totalLabel={t("total")}
        totalMinor={fixture.categorySpending.totalMinor}
        locale={locale}
        items={fixture.categorySpending.items.map((item) => ({
          ...item,
          name: names[item.categoryId as keyof typeof names] ?? t("categories"),
        }))}
      />
    );
  },
};
export const CategorySpendingItem: Story = {
  render: function LocalizedCategorySpendingItem() {
    const { t } = useTranslation();
    return (
      <ul className="w-64 list-none p-0">
        <CategorySpendingItemComponent
          item={{ ...fixture.categorySpending.items[0], name: t("food") }}
        />
      </ul>
    );
  },
};
export const ExpenseListItem: Story = {
  render: function LocalizedExpenseListItem() {
    const { i18n, t } = useTranslation();
    return (
      <ul className="w-64 list-none p-0">
        <ExpenseListItemComponent
          expense={{
            ...fixture.expenses[0],
            description: t("lunch"),
            categoryName: t("food"),
          }}
          locale={getLocale(i18n.resolvedLanguage ?? i18n.language)}
          categoryOptions={[
            { id: "food", name: t("food") },
            { id: "unclassified", name: t("unclassified") },
          ]}
          categorySelectLabel={t("reclassifyExpense", {
            description: fixture.expenses[0].description,
          })}
          deleteLabel={t("deleteExpense", {
            description: fixture.expenses[0].description,
          })}
          onCategoryChange={() => undefined}
          onDelete={() => undefined}
        />
      </ul>
    );
  },
};
