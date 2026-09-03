import { useState } from "react";
import { CategoryService } from "@/services/categories/category-service";
import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useTranslation } from "react-i18next";

import { I18nProvider } from "@/i18n/i18n-provider";
import { renderWithProviders } from "@/test/render";

import { mapCategoriesToItems } from "../category-display";
import { useCategories } from "@/features/categories/hooks/use-categories";

import { CategoryPanel } from "./category-panel";

function CategoryPanelHarness() {
  const { t } = useTranslation();
  const [service] = useState(
    () => new CategoryService({ createId: () => "custom-health" }),
  );
  const session = useCategories(service);

  return (
    <CategoryPanel
      categories={mapCategoriesToItems(session.categories, t)}
      onCreateCategory={session.createCategory}
      onDeleteCategory={session.deleteCategory}
    />
  );
}

function renderCategoryPanel(initialLocale: "en" | "es" = "en") {
  return renderWithProviders(
    <I18nProvider initialLocale={initialLocale}>
      <CategoryPanelHarness />
    </I18nProvider>,
  );
}

describe("CategoryPanel", () => {
  it("renders the fresh category session with zero totals and protects Unclassified", () => {
    renderCategoryPanel();
    const panel = within(
      screen.getByRole("complementary", { name: "Categories" }),
    );

    expect(panel.getAllByRole("listitem")).toHaveLength(1);
    expect(panel.getAllByText("$0.00")).toHaveLength(1);
    expect(
      panel
        .getAllByRole("listitem")
        .map((item) => within(item).getByText("Unclassified").textContent),
    ).toEqual(["Unclassified"]);
    expect(
      panel.queryByRole("button", { name: "Delete Unclassified" }),
    ).not.toBeInTheDocument();
  });

  it("moves focus into the form, discards a canceled draft, and restores focus", async () => {
    const { user } = renderCategoryPanel();
    const panel = within(screen.getByRole("complementary"));
    const newButton = panel.getByRole("button", { name: "New" });

    await user.click(newButton);
    const input = panel.getByRole("textbox", { name: "Category name" });
    expect(input).toHaveFocus();
    await user.type(input, "Discard me");
    await user.click(panel.getByRole("button", { name: "Cancel" }));

    expect(panel.queryByRole("textbox")).not.toBeInTheDocument();
    const restoredNewButton = panel.getByRole("button", { name: "New" });
    expect(restoredNewButton).toHaveFocus();

    await user.click(restoredNewButton);
    expect(panel.getByRole("textbox", { name: "Category name" })).toHaveValue(
      "",
    );
  });

  it("retains an invalid draft with associated localized feedback and input focus", async () => {
    const { user } = renderCategoryPanel("es");
    const panel = within(
      screen.getByRole("complementary", { name: "Categorías" }),
    );

    await user.click(panel.getByRole("button", { name: "Nueva" }));
    const input = panel.getByRole("textbox", {
      name: "Nombre de la categoría",
    });
    await user.type(input, "   ");
    await user.click(panel.getByRole("button", { name: "Agregar" }));

    const error = panel.getByRole("alert");
    expect(error).toHaveTextContent("Ingresá un nombre para la categoría.");
    expect(input).toHaveValue("   ");
    expect(input).toHaveFocus();
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("aria-describedby", error.id);
  });

  it("creates and deletes eligible categories while restoring focus after success", async () => {
    const { user } = renderCategoryPanel();
    const panel = within(screen.getByRole("complementary"));
    const newButton = panel.getByRole("button", { name: "New" });

    await user.click(newButton);
    await user.type(
      panel.getByRole("textbox", { name: "Category name" }),
      "  Health  ",
    );
    await user.keyboard("{Enter}");

    expect(panel.getByText("Health")).toBeVisible();
    expect(panel.queryByRole("textbox")).not.toBeInTheDocument();
    expect(panel.getByRole("button", { name: "New" })).toHaveFocus();

    await user.click(panel.getByRole("button", { name: "Delete Health" }));
    expect(panel.queryByText("Health")).not.toBeInTheDocument();

    expect(panel.getByText("Unclassified")).toBeVisible();
  });
});
