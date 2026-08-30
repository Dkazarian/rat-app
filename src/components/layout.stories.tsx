import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useTranslation } from "react-i18next";

import { AppShell as AppShellComponent } from "@/components/dashboard-page/app-shell";
import { DashboardLayout as DashboardLayoutComponent } from "@/components/dashboard-page/dashboard-layout";
import { Footer as FooterComponent } from "@/components/dashboard-page/footer";
import { ResultsPanel as ResultsPanelComponent } from "@/components/dashboard-page/results-panel";

const meta = {
  title: "Components/Layout",
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <main className="min-h-screen min-w-[360px] bg-[#18161e] p-6 text-sm text-[#f7f2fa]">
        <Story />
      </main>
    ),
  ],
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const AppShellStory: Story = {
  name: "AppShell",
  render: function LocalizedAppShell() {
    const { t } = useTranslation();
    return (
      <AppShellComponent label={t("appLabel")}>
        {t("appName")}
      </AppShellComponent>
    );
  },
};
export const DashboardLayoutStory: Story = {
  name: "DashboardLayout",
  render: function LocalizedDashboardLayout() {
    const { t } = useTranslation();
    return (
      <div className="w-[700px] max-w-full">
        <DashboardLayoutComponent
          categoryPanel={
            <div className="rounded-xl border p-4">{t("categories")}</div>
          }
          resultsPanel={
            <div className="rounded-xl border p-4">{t("recentExpenses")}</div>
          }
        />
      </div>
    );
  },
};
export const ResultsPanelStory: Story = {
  name: "ResultsPanel",
  render: function LocalizedResultsPanel() {
    const { t } = useTranslation();
    return (
      <ResultsPanelComponent
        spendingSummary={<div>{t("spending")}</div>}
        expenseList={<div>{t("recentExpenses")}</div>}
      />
    );
  },
};
export const FooterStory: Story = {
  name: "Footer",
  render: function LocalizedFooter() {
    const { t } = useTranslation();
    return (
      <FooterComponent
        poweredByLabel={t("poweredBy")}
        model="fixture/model"
        sourceLabel={t("viewSource")}
        sourceAriaLabel={t("viewSourceAria")}
        sourceHref="https://github.com/Dkazarian/rat-app"
      />
    );
  },
};
