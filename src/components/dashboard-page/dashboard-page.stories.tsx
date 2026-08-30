import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { dashboardFixtures } from "@/fixtures/dashboard-fixtures";

import { DashboardPage } from "./dashboard-page";

const meta = {
  title: "Pages/Dashboard",
  component: DashboardPage,
  parameters: { layout: "fullscreen" },
  args: { fixture: dashboardFixtures.success },
} satisfies Meta<typeof DashboardPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DesktopSuccess: Story = {
  parameters: { viewport: { defaultViewport: "desktop" } },
};

export const Empty: Story = { args: { fixture: dashboardFixtures.empty } };
export const Loading: Story = { args: { fixture: dashboardFixtures.loading } };
export const ExtractionFailure: Story = {
  args: { fixture: dashboardFixtures["extraction-failure"] },
};
export const ProviderError: Story = {
  args: { fixture: dashboardFixtures["provider-error"] },
};
