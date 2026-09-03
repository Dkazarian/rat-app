import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { pageSessionFixtures } from "@/features/dashboard/fixtures/dashboard-session-fixtures";
import { produceMockExpenseBatch } from "@/features/dashboard/mock-expense-capture";

import { DashboardPage } from "./dashboard-page";

const meta = {
  title: "Pages/Dashboard",
  component: DashboardPage,
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
    produceExpenseBatch: produceMockExpenseBatch,
  },
};
export const Loading: Story = {
  args: { initialSession: pageSessionFixtures.loading },
};

export const PartialBatch: Story = {
  args: {
    initialSession: pageSessionFixtures.empty,
    produceExpenseBatch: () => [
      { description: "Accepted coffee", amountMinor: 450, categoryId: "food" },
      { description: "Rejected expense", amountMinor: 0, categoryId: "food" },
    ],
  },
};

export const AllInvalidBatch: Story = {
  args: {
    initialSession: pageSessionFixtures.empty,
    produceExpenseBatch: () => [
      { description: "Rejected expense", amountMinor: 0, categoryId: "food" },
      { description: " ", amountMinor: 100, categoryId: "food" },
    ],
  },
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
