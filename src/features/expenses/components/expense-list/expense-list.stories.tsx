import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { dashboardFixtures } from "@/features/dashboard/fixtures/dashboard-view-fixtures";
import { ExpenseList } from "./expense-list";

const meta = {
  title: "Components/ExpenseList",
  component: ExpenseList,
  parameters: { layout: "centered" },
  args: { expenses: dashboardFixtures.success.expenses },
} satisfies Meta<typeof ExpenseList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Populated: Story = {};
export const Empty: Story = { args: { expenses: [] } };
