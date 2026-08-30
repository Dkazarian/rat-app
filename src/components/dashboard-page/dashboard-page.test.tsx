import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { dashboardFixtures } from "@/fixtures/dashboard-fixtures";
import { I18nProvider } from "@/i18n/i18n-provider";
import { renderWithProviders } from "@/test/render";

import { DashboardPage } from "./dashboard-page";

describe("DashboardPage", () => {
  it("renders matching chart and textual fixture data", () => {
    renderWithProviders(
      <I18nProvider>
        <DashboardPage fixture={dashboardFixtures.success} />
      </I18nProvider>,
    );

    expect(
      screen.getByRole("img", {
        name: "Spending: Food 40%, Transport 26%, Home 20%, Fun 14%",
      }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("$1,284.50")).toHaveLength(1);
    expect(screen.getByText("40%")).toBeVisible();
  });

  it("switches all interface copy to Spanish", async () => {
    const { user } = renderWithProviders(
      <I18nProvider>
        <DashboardPage fixture={dashboardFixtures.success} />
      </I18nProvider>,
    );

    await user.tab();
    expect(screen.getByRole("button", { name: "English" })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "Español" })).toHaveFocus();
    await user.keyboard("{Enter}");

    expect(screen.getByRole("heading", { name: "Categorías" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Gastos" })).toBeVisible();
    expect(screen.getByDisplayValue(/Almuerzo/)).toBeVisible();
    expect(screen.getByText("$1.284,50")).toBeVisible();
    expect(document.documentElement).toHaveAttribute("lang", "es");
  });
});
