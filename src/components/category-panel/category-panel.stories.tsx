import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { dashboardFixtures } from "@/fixtures/dashboard-fixtures";

import { CategoryPanel } from "./category-panel";

const meta = {
  title: "Components/CategoryPanel",
  component: CategoryPanel,
  parameters: { layout: "centered" },
  args: {
    locale: "en",
    title: "Categories",
    addLabel: "New",
    categories: dashboardFixtures.success.categories,
  },
} satisfies Meta<typeof CategoryPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Populated: Story = {};
export const EmptyTotals: Story = {
  args: { categories: dashboardFixtures.empty.categories },
};
