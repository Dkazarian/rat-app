import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useLocale } from "@/i18n/locale-context";

import { dashboardFixtures } from "@/features/dashboard/fixtures/dashboard-view-fixtures";

import { ExpenseList } from "./expense-list";
import type { ExpenseListItemData } from "@/features/expenses/view-types";

type StoryProps = Readonly<{
  expenses: ReadonlyArray<ExpenseListItemData>;
}>;

function LocalizedExpenseList({ expenses }: StoryProps) {
  const { t } = useLocale();

  return (
    <ExpenseList
      title={t("recentExpenses")}
      periodLabel={t("today")}
      expenses={expenses}
      emptyMessage={t("noExpenses")}
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
