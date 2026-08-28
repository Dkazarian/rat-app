import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { dashboardFixtures } from "@/fixtures/dashboard-fixtures";

import { SpendingSummary } from "./spending-summary";

const fixture = dashboardFixtures.success;

const meta = {
  title: "Components/SpendingSummary",
  component: SpendingSummary,
  args: {
    locale: "en",
    title: "Spending",
    periodLabel: "This month",
    totalLabel: "total",
    totalMinor: fixture.spending.totalMinor,
    chartLabel: "Spending: Food 40%, Transport 26%, Home 20%, Fun 14%",
    items: fixture.spending.items,
  },
  decorators: [
    (Story) => (
      <main className="min-h-screen bg-[#26222d] p-6 text-sm text-[#f7f2fa]">
        <Story />
      </main>
    ),
  ],
} satisfies Meta<typeof SpendingSummary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Populated: Story = {};
export const Empty: Story = {
  args: {
    totalMinor: 0,
    chartLabel: "No spending",
    items: dashboardFixtures.empty.spending.items,
  },
};
