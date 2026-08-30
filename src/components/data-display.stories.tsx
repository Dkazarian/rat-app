import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useTranslation } from "react-i18next";

import { CategoryItem as CategoryItemComponent } from "@/components/category-panel/category-item";
import { ExpenseItem as ExpenseItemComponent } from "@/components/expense-list/expense-item";
import { SpendingCategoryPercentItem as SpendingCategoryPercentItemComponent } from "@/components/spending-summary/spending-category-percent-item";
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

export const CategoryItem: Story = {
  render: function LocalizedCategoryItem() {
    const { t } = useTranslation();
    return (
      <ul className="w-64 list-none p-0">
        <CategoryItemComponent
          category={{ ...fixture.categories[0], name: t("food") }}
          locale={getLocale("en")}
        />
      </ul>
    );
  },
};
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
        totalMinor={fixture.spending.totalMinor}
        locale={locale}
        items={fixture.spending.items.map((item) => ({
          ...item,
          name: names[item.categoryId as keyof typeof names] ?? t("categories"),
        }))}
      />
    );
  },
};
export const SpendingCategoryPercentItem: Story = {
  render: function LocalizedSpendingCategoryPercentItem() {
    const { t } = useTranslation();
    return (
      <ul className="w-64 list-none p-0">
        <SpendingCategoryPercentItemComponent
          item={{ ...fixture.spending.items[0], name: t("food") }}
        />
      </ul>
    );
  },
};
export const ExpenseItem: Story = {
  render: function LocalizedExpenseItem() {
    const { i18n, t } = useTranslation();
    return (
      <ul className="w-64 list-none p-0">
        <ExpenseItemComponent
          expense={{
            ...fixture.expenses[0],
            description: t("lunch"),
            categoryName: t("food"),
          }}
          locale={getLocale(i18n.resolvedLanguage ?? i18n.language)}
        />
      </ul>
    );
  },
};
