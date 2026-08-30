import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { dashboardFixtures } from "@/fixtures/dashboard-fixtures";

import { DashboardPage } from "./dashboard-page";

const meta = {
  title: "Pages/Dashboard",
  component: DashboardPage,
  parameters: { layout: "fullscreen" },
  args: { initialSession: dashboardFixtures.success },
} satisfies Meta<typeof DashboardPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DesktopSuccess: Story = {
  parameters: { viewport: { defaultViewport: "desktop" } },
};

export const Empty: Story = {
  args: { initialSession: dashboardFixtures.empty },
};
export const Loading: Story = {
  args: { initialSession: dashboardFixtures.loading },
};
export const ExtractionFailure: Story = {
  args: { initialSession: dashboardFixtures["extraction-failure"] },
};
export const ProviderError: Story = {
  args: { initialSession: dashboardFixtures["provider-error"] },
};
