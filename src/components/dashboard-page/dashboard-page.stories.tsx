import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { dashboardFixtures } from "@/fixtures/dashboard-fixtures";
import { LanguageProvider } from "@/localization/language-provider";
import type { Locale } from "@/localization/messages";
import type { DashboardFixture } from "@/types/presentation";

import { DashboardPage } from "./dashboard-page";

type DashboardStoryProps = Readonly<{
  fixture: DashboardFixture;
  locale: Locale;
}>;

function DashboardStory({ fixture, locale }: DashboardStoryProps) {
  return (
    <LanguageProvider initialLocale={locale}>
      <DashboardPage fixture={fixture} />
    </LanguageProvider>
  );
}

const meta = {
  title: "Pages/Dashboard",
  component: DashboardStory,
  parameters: { layout: "fullscreen" },
  args: { fixture: dashboardFixtures.success, locale: "en" },
} satisfies Meta<typeof DashboardStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DesktopSuccess: Story = {
  parameters: { viewport: { defaultViewport: "desktop" } },
};

export const Spanish: Story = { args: { locale: "es" } };
export const Empty: Story = { args: { fixture: dashboardFixtures.empty } };
export const Loading: Story = { args: { fixture: dashboardFixtures.loading } };
export const ExtractionFailure: Story = {
  args: { fixture: dashboardFixtures["extraction-failure"] },
};
export const ProviderError: Story = {
  args: { fixture: dashboardFixtures["provider-error"] },
};
