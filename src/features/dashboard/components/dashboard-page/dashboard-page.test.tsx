import { screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  pageSessionFixtures,
  sampleCategories,
} from "@/features/dashboard/fixtures/dashboard-session-fixtures";
import { I18nProvider } from "@/i18n/i18n-provider";
import { renderWithProviders } from "@/test/render";

import { DashboardPage } from "./dashboard-page";

describe("DashboardPage", () => {
  it("shows accepted expenses and reports skipped candidates", async () => {
    const { user } = renderWithProviders(
      <I18nProvider>
        <DashboardPage
          produceExpenseBatch={() => [
            {
              description: "Accepted coffee",
              amountMinor: 450,
              categoryId: null,
            },
            {
              description: "Rejected expense",
              amountMinor: 0,
              categoryId: null,
            },
          ]}
        />
      </I18nProvider>,
    );
    await user.click(screen.getByRole("button", { name: "Sort it" }));
    expect(screen.getByText("Accepted coffee")).toBeVisible();
    expect(screen.queryByText("Rejected expense")).not.toBeInTheDocument();
    expect(screen.getByText("1 expense sorted. 1 skipped.")).toBeVisible();
  });

  it("uses service-generated category and expense IDs and the supplied user ID", async () => {
    const randomId = vi.spyOn(crypto, "randomUUID");
    try {
      const { user } = renderWithProviders(
        <I18nProvider>
          <DashboardPage
            sessionDependencies={{
              createUserId: () => "deterministic-user",
            }}
            produceExpenseBatch={() => [
              {
                description: "Fixed expense",
                amountMinor: 100,
                categoryId: null,
              },
            ]}
          />
        </I18nProvider>,
      );
      await user.click(screen.getByRole("button", { name: "Sort it" }));
      await user.click(screen.getByRole("button", { name: "New" }));
      await user.type(
        screen.getByRole("textbox", { name: "Category name" }),
        "Health",
      );
      await user.click(screen.getByRole("button", { name: "Add" }));
      expect(randomId).toHaveBeenCalledTimes(2);
    } finally {
      randomId.mockRestore();
    }
  });
  it("renders matching chart and textual fixture data", () => {
    renderWithProviders(
      <I18nProvider>
        <DashboardPage initialSession={pageSessionFixtures.success} />
      </I18nProvider>,
    );

    expect(
      screen.getByRole("img", {
        name: "Spending: Food 40%, Home 20%, Transport 26%, Fun 14%. total: $1284.50",
      }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("$1284.50")).toHaveLength(1);
    expect(screen.getByText("40%")).toBeVisible();
  });

  it("switches all interface copy to Spanish", async () => {
    const { user } = renderWithProviders(
      <I18nProvider>
        <DashboardPage initialSession={pageSessionFixtures.success} />
      </I18nProvider>,
    );

    await user.tab();
    expect(screen.getByRole("button", { name: "English" })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "Español" })).toHaveFocus();
    await user.keyboard("{Enter}");

    expect(screen.getByRole("button", { name: "Español" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "English" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(screen.getByRole("heading", { name: "Categorías" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Gastos" })).toBeVisible();
    expect(screen.getByText("Lunch and groceries")).toBeVisible();
    expect(screen.getByText("$1284.50")).toBeVisible();
    expect(document.documentElement).toHaveAttribute("lang", "es");
  });

  it("coordinates category creation and deletion across language changes", async () => {
    const { user } = renderWithProviders(
      <I18nProvider>
        <DashboardPage initialSession={pageSessionFixtures.empty} />
      </I18nProvider>,
    );
    const categories = within(
      screen.getByRole("complementary", { name: "Categories" }),
    );

    expect(categories.getAllByRole("listitem")).toHaveLength(1);
    expect(categories.getAllByText("$0.00")).toHaveLength(1);
    expect(screen.getByText("No expenses yet.")).toBeVisible();
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

    await user.click(screen.getByRole("button", { name: "Español" }));
    const translatedCategories = within(
      screen.getByRole("complementary", { name: "Categorías" }),
    );
    expect(translatedCategories.queryByText("Comida")).not.toBeInTheDocument();
    expect(translatedCategories.getByText("Sin clasificar")).toBeVisible();
    expect(translatedCategories.getByText("Health")).toBeVisible();
    await user.click(
      translatedCategories.getByRole("button", { name: "Eliminar Health" }),
    );
    expect(translatedCategories.queryByText("Health")).not.toBeInTheDocument();
  });

  it("controls the input and renders a deterministic accepted capture", async () => {
    const { user } = renderWithProviders(
      <I18nProvider>
        <DashboardPage
          initialSession={pageSessionFixtures.empty}
          produceExpenseBatch={(inputValue) => [
            {
              id: "expense-lunch",
              description: inputValue,
              amountMinor: 1_800,
              categoryId: "food",
            },
          ]}
        />
      </I18nProvider>,
    );
    const input = screen.getByRole("textbox", {
      name: "What did you spend?",
    });

    await user.type(input, "Lunch with Alex");
    expect(input).toHaveValue("Lunch with Alex");
    await user.click(screen.getByRole("button", { name: "Sort it" }));

    expect(screen.getByText("Lunch with Alex")).toBeVisible();
    expect(input).toHaveValue("");
    expect(screen.getByText("1 expense sorted.")).toBeVisible();
    expect(screen.getAllByText("$18.00")).toHaveLength(3);
  });

  it("preserves byte-for-byte input and announces a rejected zero-item capture", async () => {
    const { user } = renderWithProviders(
      <I18nProvider>
        <DashboardPage
          initialSession={pageSessionFixtures.empty}
          produceExpenseBatch={() => []}
        />
      </I18nProvider>,
    );
    const input = screen.getByRole("textbox", {
      name: "What did you spend?",
    });
    const exactInput = "  coffee???\n$4.50  ";

    await user.type(input, exactInput);
    await user.click(screen.getByRole("button", { name: "Sort it" }));

    expect(input).toHaveValue(exactInput);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Try including what you bought and the amount.",
    );
    expect(screen.queryByText("$4.50")).not.toBeInTheDocument();
  });

  it("reclassifies an expense with every current category available", async () => {
    const { user } = renderWithProviders(
      <I18nProvider>
        <DashboardPage initialSession={pageSessionFixtures.success} />
      </I18nProvider>,
    );
    const selector = screen.getByRole("combobox", {
      name: "Change category for Lunch and groceries",
    });

    expect(
      within(selector)
        .getAllByRole("option")
        .map((option) => option.textContent),
    ).toEqual(["Food", "Home", "Transport", "Fun", "Unclassified"]);
    await user.selectOptions(
      selector,
      within(selector).getByRole("option", { name: "Home" }),
    );

    expect(
      (
        within(selector).getByRole("option", {
          name: "Home",
        }) as HTMLOptionElement
      ).selected,
    ).toBe(true);
    expect(
      screen.getByRole("img", {
        name: "Spending: Home 60%, Transport 26%, Fun 14%. total: $1284.50",
      }),
    ).toBeInTheDocument();
    const categories = within(screen.getByRole("complementary"));
    expect(
      within(categories.getByText("Food").closest("li")!).getByText("$0.00"),
    ).toBeVisible();
    expect(
      within(categories.getByText("Home").closest("li")!).getByText("$770.60"),
    ).toBeVisible();

    await user.selectOptions(selector, "");
    expect(selector).toHaveValue("");
    expect(
      screen.getByRole("img", {
        name: "Spending: Home 20%, Transport 26%, Fun 14%, Unclassified 40%. total: $1284.50",
      }),
    ).toBeInTheDocument();

    await user.selectOptions(
      selector,
      within(selector).getByRole("option", { name: "Food" }),
    );
    expect(
      (
        within(selector).getByRole("option", {
          name: "Food",
        }) as HTMLOptionElement
      ).selected,
    ).toBe(true);
  });

  it("deletes an expense immediately and synchronizes every derived result", async () => {
    const { user } = renderWithProviders(
      <I18nProvider>
        <DashboardPage initialSession={pageSessionFixtures.success} />
      </I18nProvider>,
    );

    await user.click(
      screen.getByRole("button", {
        name: "Delete Lunch and groceries",
      }),
    );

    expect(screen.queryByText("Lunch and groceries")).not.toBeInTheDocument();
    expect(
      screen.getByRole("img", {
        name: "Spending: Home 33%, Transport 44%, Fun 23%. total: $766.30",
      }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("$766.30")).toHaveLength(1);
  });

  it("keeps expenses visible under Unclassified after populated-category deletion", async () => {
    const { user } = renderWithProviders(
      <I18nProvider>
        <DashboardPage initialSession={pageSessionFixtures.success} />
      </I18nProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Delete Fun" }));

    expect(screen.getByText("Movie night")).toBeVisible();
    expect(
      screen.getByRole("combobox", {
        name: "Change category for Movie night",
      }),
    ).toHaveValue("");
    expect(screen.queryByText("Fun")).not.toBeInTheDocument();
    expect(
      screen.getByRole("img", {
        name: "Spending: Food 40%, Home 20%, Transport 26%, Unclassified 14%. total: $1284.50",
      }),
    ).toBeInTheDocument();
  });

  it("gives each correction control a localized expense-specific name", async () => {
    const { user } = renderWithProviders(
      <I18nProvider>
        <DashboardPage initialSession={pageSessionFixtures.success} />
      </I18nProvider>,
    );
    const exactInput = "  Keep this input byte-for-byte  ";

    await user.type(
      screen.getByRole("textbox", { name: "What did you spend?" }),
      exactInput,
    );
    await user.click(screen.getByRole("button", { name: "Español" }));

    expect(
      screen.getByRole("combobox", {
        name: "Cambiar categoría de Lunch and groceries",
      }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", {
        name: "Eliminar Lunch and groceries",
      }),
    ).toBeVisible();
    expect(screen.getAllByText("Fun")[0]).toBeVisible();
    expect(screen.getByText("Lunch and groceries")).toBeVisible();
    expect(
      screen.getByRole("textbox", { name: "¿En qué gastaste?" }),
    ).toHaveValue(exactInput);
  });

  it("distinguishes correction controls for similarly named expenses", () => {
    renderWithProviders(
      <I18nProvider>
        <DashboardPage
          initialSession={{
            ...pageSessionFixtures.empty,
            expenses: [
              {
                description: "Lunch",
                amountMinor: 1_000,
                categoryId: "food",
              },
              {
                description: "Lunch with Alex",
                amountMinor: 2_000,
                categoryId: "food",
              },
            ],
          }}
        />
      </I18nProvider>,
    );

    expect(
      screen.getByRole("combobox", { name: "Change category for Lunch" }),
    ).toBeVisible();
    expect(
      screen.getByRole("combobox", {
        name: "Change category for Lunch with Alex",
      }),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Delete Lunch" })).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Delete Lunch with Alex" }),
    ).toBeVisible();
  });

  it("keeps correction controls keyboard reachable with visible focus styles", async () => {
    const { user } = renderWithProviders(
      <I18nProvider>
        <DashboardPage initialSession={pageSessionFixtures.success} />
      </I18nProvider>,
    );
    const selector = screen.getByRole("combobox", {
      name: "Change category for Lunch and groceries",
    });
    const deleteButton = screen.getByRole("button", {
      name: "Delete Lunch and groceries",
    });

    selector.focus();
    expect(selector).toHaveFocus();
    expect(selector).toHaveClass("focus-visible:outline-2");
    await user.keyboard("{Tab}");
    expect(deleteButton).toHaveFocus();
    expect(deleteButton).toHaveClass("focus-visible:outline-2");
  });

  it("completes capture, correction, and deletion with keyboard activation", async () => {
    const { user } = renderWithProviders(
      <I18nProvider>
        <DashboardPage
          initialSession={{
            ...pageSessionFixtures.empty,
            categories: sampleCategories,
          }}
          produceExpenseBatch={() => [
            {
              id: "keyboard-lunch",
              description: "Keyboard lunch",
              amountMinor: 1_000,
              categoryId: "food",
            },
            {
              id: "keyboard-taxi",
              description: "Keyboard taxi",
              amountMinor: 500,
              categoryId: "transport",
            },
          ]}
        />
      </I18nProvider>,
    );
    const input = screen.getByRole("textbox", {
      name: "What did you spend?",
    });

    input.focus();
    await user.keyboard("Keyboard input");
    const submit = screen.getByRole("button", { name: "Sort it" });
    submit.focus();
    await user.keyboard("{Enter}");
    expect(screen.getByText("Keyboard lunch")).toBeVisible();

    const selector = screen.getByRole("combobox", {
      name: "Change category for Keyboard lunch",
    });
    selector.focus();
    await user.selectOptions(
      selector,
      within(selector).getByRole("option", { name: "Home" }),
    );
    expect(
      (
        within(selector).getByRole("option", {
          name: "Home",
        }) as HTMLOptionElement
      ).selected,
    ).toBe(true);

    const deleteExpense = screen.getByRole("button", {
      name: "Delete Keyboard lunch",
    });
    deleteExpense.focus();
    await user.keyboard("{Enter}");
    expect(screen.queryByText("Keyboard lunch")).not.toBeInTheDocument();

    const deleteCategory = screen.getByRole("button", {
      name: "Delete Transport",
    });
    deleteCategory.focus();
    await user.keyboard("{Enter}");
    expect(
      screen.getByRole("combobox", {
        name: "Change category for Keyboard taxi",
      }),
    ).toHaveValue("");
  });
});
