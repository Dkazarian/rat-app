import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { getLocale } from "@/i18n";
import { useTranslation } from "react-i18next";

import { dashboardFixtures } from "@/fixtures/dashboard-fixtures";

import { ExpenseList } from "./expense-list";
import type { ExpenseItemData } from "./expense-item";

type StoryProps = Readonly<{
  expenses: ReadonlyArray<ExpenseItemData>;
}>;

function LocalizedExpenseList({ expenses }: StoryProps) {
  const { i18n, t } = useTranslation();
  const locale = getLocale(i18n.resolvedLanguage ?? i18n.language);
  const descriptions: Record<string, string> = {
    "expense-lunch": t("lunch"),
    "expense-coffee": t("coffee"),
    "expense-taxi": t("taxi"),
  };
  const categories: Record<string, string> = {
    food: t("food"),
    transport: t("transport"),
    home: t("home"),
    fun: t("fun"),
  };

  return (
    <ExpenseList
      locale={locale}
      title={t("recentExpenses")}
      periodLabel={t("today")}
      expenses={expenses.map((expense) => ({
        ...expense,
        description: descriptions[expense.id] ?? expense.description,
        categoryName: categories[expense.categoryId] ?? t("categories"),
      }))}
    />
  );
}

const meta = {
  title: "Components/ExpenseList",
  component: LocalizedExpenseList,
  parameters: { layout: "centered" },
  args: {
    expenses: dashboardFixtures.success.expenses,
  },
} satisfies Meta<typeof LocalizedExpenseList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Populated: Story = {};
export const Empty: Story = { args: { expenses: [] } };
