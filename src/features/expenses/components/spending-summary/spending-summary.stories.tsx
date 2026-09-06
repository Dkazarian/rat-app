import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { dashboardFixtures } from "@/features/dashboard/fixtures/dashboard-view-fixtures";
import { SpendingSummary } from "./spending-summary";

const meta = {
  title: "Components/SpendingSummary",
  component: SpendingSummary,
  args: {
    totalMinor: dashboardFixtures.success.categorySpending.totalMinor,
    items: dashboardFixtures.success.categorySpending.items,
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
    items: dashboardFixtures.empty.categorySpending.items,
  },
};
