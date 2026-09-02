import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";

import { pageSessionFixtures } from "@/features/session/page-session-fixtures";
import { producePhaseFourDemoBatch } from "@/features/session/deterministic-capture";

import { DashboardPage, type DashboardPageProps } from "./dashboard-page";

function DeterministicDashboard(props: DashboardPageProps) {
  const [sessionDependencies] = useState(() => {
    let expenseId = 0;
    let categoryId = 0;
    return {
      createExpenseId: () => `story-expense-${++expenseId}`,
      createCategoryId: () => `story-category-${++categoryId}`,
    };
  });
  return <DashboardPage {...props} sessionDependencies={sessionDependencies} />;
}

const meta = {
  title: "Pages/Dashboard",
  component: DashboardPage,
  render: (args) => <DeterministicDashboard {...args} />,
  parameters: { layout: "fullscreen" },
  args: { initialSession: pageSessionFixtures.success },
} satisfies Meta<typeof DashboardPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DesktopSuccess: Story = {
  parameters: { viewport: { defaultViewport: "desktop" } },
};

export const Empty: Story = {
  args: {
    initialSession: pageSessionFixtures.empty,
    produceExpenseBatch: producePhaseFourDemoBatch,
  },
};
export const Loading: Story = {
  args: { initialSession: pageSessionFixtures.loading },
};
export const ExtractionFailure: Story = {
  args: {
    initialSession: pageSessionFixtures["extraction-failure"],
    produceExpenseBatch: () => [],
  },
};
export const ProviderError: Story = {
  args: { initialSession: pageSessionFixtures["provider-error"] },
};

export const OneAcceptedBatch: Story = {
  args: { initialSession: pageSessionFixtures["one-accepted-batch"] },
};

export const CumulativeBatches: Story = {
  args: { initialSession: pageSessionFixtures["cumulative-batches"] },
};

export const Reclassification: Story = {
  args: { initialSession: pageSessionFixtures.reclassified },
};

export const ExpenseDeletion: Story = {
  args: { initialSession: pageSessionFixtures["expense-deleted"] },
};

export const PopulatedCategoryDeletion: Story = {
  args: { initialSession: pageSessionFixtures["category-deleted"] },
};

export const Spanish: Story = {
  args: { initialSession: pageSessionFixtures.success },
  globals: { locale: "es" },
};

export const NarrowCorrection: Story = {
  args: { initialSession: pageSessionFixtures.success },
  parameters: { viewport: { defaultViewport: "narrow" } },
};
