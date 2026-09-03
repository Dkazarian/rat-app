import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { getLocale } from "@/i18n";
import { useTranslation } from "react-i18next";

import { dashboardFixtures } from "@/features/dashboard/fixtures/dashboard-view-fixtures";

import { ExpenseList } from "./expense-list";
import type { ExpenseListItemData } from "@/features/expenses/view-types";

type StoryProps = Readonly<{
  expenses: ReadonlyArray<ExpenseListItemData>;
}>;

function LocalizedExpenseList({ expenses }: StoryProps) {
  const { i18n, t } = useTranslation();
  const locale = getLocale(i18n.resolvedLanguage ?? i18n.language);
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
        categoryName: categories[expense.categoryId] ?? t("categories"),
      }))}
      categoryOptions={[
        { id: "food", name: t("food") },
        { id: "home", name: t("home") },
        { id: "transport", name: t("transport") },
        { id: "unclassified", name: t("unclassified") },
      ]}
      emptyMessage={t("noExpenses")}
      getCategorySelectLabel={(expense) =>
        t("reclassifyExpense", { description: expense.description })
      }
      getDeleteLabel={(expense) =>
        t("deleteExpense", { description: expense.description })
      }
      onCategoryChange={() => undefined}
      onDeleteExpense={() => undefined}
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
