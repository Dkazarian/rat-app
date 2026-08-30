import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { dashboardFixtures } from "@/fixtures/dashboard-fixtures";
import { I18nProvider } from "@/i18n/i18n-provider";
import { renderWithProviders } from "@/test/render";

import { DashboardPage } from "./dashboard-page";

describe("DashboardPage", () => {
  it("renders matching chart and textual fixture data", () => {
    renderWithProviders(
      <I18nProvider>
        <DashboardPage initialSession={dashboardFixtures.success} />
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
        <DashboardPage initialSession={dashboardFixtures.success} />
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

  it("coordinates category creation and deletion across language changes", async () => {
    const { user } = renderWithProviders(
      <I18nProvider>
        <DashboardPage initialSession={dashboardFixtures.empty} />
      </I18nProvider>,
    );
    const categories = within(
      screen.getByRole("complementary", { name: "Categories" }),
    );

    expect(categories.getAllByRole("listitem")).toHaveLength(4);
    expect(categories.getAllByText("$0.00")).toHaveLength(4);
    expect(
      categories.queryByRole("button", { name: "Delete Unclassified" }),
    ).not.toBeInTheDocument();

    await user.click(categories.getByRole("button", { name: "New" }));
    await user.type(
      categories.getByRole("textbox", { name: "Category name" }),
      "  Health  ",
    );
    await user.click(categories.getByRole("button", { name: "Add" }));

    expect(categories.getByText("Health")).toBeVisible();
    expect(categories.queryByRole("textbox")).not.toBeInTheDocument();

    await user.click(categories.getByRole("button", { name: "Delete Food" }));
    expect(categories.queryByText("Food")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Español" }));
    const translatedCategories = within(
      screen.getByRole("complementary", { name: "Categorías" }),
    );
    expect(translatedCategories.queryByText("Comida")).not.toBeInTheDocument();
    expect(translatedCategories.getByText("Sin clasificar")).toBeVisible();
    expect(translatedCategories.getByText("Health")).toBeVisible();
  });
});
