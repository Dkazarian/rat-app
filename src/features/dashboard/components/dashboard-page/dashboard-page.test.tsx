import { screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { CategoryDto, ExpenseDto } from "@/contracts/session-api";
import {
  SessionApiError,
  type SessionApi,
} from "@/features/dashboard/api/session-api-client";
import { I18nProvider } from "@/i18n/i18n-provider";
import { renderWithProviders } from "@/test/render";
import { DashboardPage } from "./dashboard-page";

function createApi() {
  let categories: CategoryDto[] = [
    {
      id: "10000000-0000-4000-8000-000000000001",
      name: "Food",
      color: "coral",
      totalMinor: 500,
    },
  ];
  let expenses: ExpenseDto[] = [
    {
      id: "20000000-0000-4000-8000-000000000001",
      description: "Lunch",
      amountMinor: 500,
      categoryId: categories[0].id,
      createdAt: 1,
    },
  ];
  const api: SessionApi = {
    createSession: vi.fn().mockResolvedValue({ sessionId: "session-id" }),
    getCategories: vi.fn(async () => ({
      categories,
      unclassifiedTotalMinor: expenses
        .filter(({ categoryId }) => categoryId === null)
        .reduce((total, expense) => total + expense.amountMinor, 0),
      totalMinor: expenses.reduce(
        (total, expense) => total + expense.amountMinor,
        0,
      ),
    })),
    createCategory: vi.fn(async (_sessionId, name) => {
      const category: CategoryDto = {
        id: "10000000-0000-4000-8000-000000000002",
        name: name.trim(),
        color: "purple",
        totalMinor: 0,
      };
      categories = [...categories, category];
      return { category };
    }),
    deleteCategory: vi.fn(async (_sessionId, id) => {
      categories = categories.filter((category) => category.id !== id);
      expenses = expenses.map((expense) =>
        expense.categoryId === id ? { ...expense, categoryId: null } : expense,
      );
    }),
    getExpenses: vi.fn(async () => ({ expenses })),
    submitPrompt: vi.fn(async () => {
      throw new SessionApiError(
        "classification_unavailable",
        "Classification is unavailable.",
        "prompt",
      );
    }),
  };
  return api;
}

function renderDashboard(api: SessionApi) {
  return renderWithProviders(
    <I18nProvider>
      <DashboardPage api={api} />
    </I18nProvider>,
  );
}

describe("DashboardPage API composition", () => {
  it("loads independent category and expense resources", async () => {
    const api = createApi();
    renderDashboard(api);
    expect(await screen.findByText("Lunch")).toBeVisible();
    expect(screen.getAllByText("Food")[0]).toBeVisible();
    expect(screen.getAllByText("Unclassified")[0]).toBeVisible();
    expect(api.getCategories).toHaveBeenCalledWith(
      "session-id",
      expect.any(AbortSignal),
    );
    expect(api.getExpenses).toHaveBeenCalledWith(
      "session-id",
      expect.any(AbortSignal),
    );
  });

  it("preserves exact prompt text when Phase 5 classification is unavailable", async () => {
    const api = createApi();
    const { user } = renderDashboard(api);
    const input = await screen.findByRole("textbox", {
      name: "What did you spend?",
    });
    const exact = "  coffee???\n$4.50  ";
    await user.type(input, exact);
    await user.click(screen.getByRole("button", { name: "Sort it" }));
    await waitFor(() =>
      expect(api.submitPrompt).toHaveBeenCalledWith("session-id", exact, "en"),
    );
    expect(input).toHaveValue(exact);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Automatic sorting is not available yet.",
    );
  });

  it("refreshes both section-owned resources after a category cascade", async () => {
    const api = createApi();
    const { user } = renderDashboard(api);
    await screen.findByText("Lunch");
    const panel = within(
      screen.getByRole("complementary", { name: "Categories" }),
    );
    await user.click(panel.getByRole("button", { name: "Delete Food" }));
    await waitFor(() =>
      expect(
        within(
          screen.getByRole("region", { name: "Recent expenses" }),
        ).getByText("Unclassified"),
      ).toBeVisible(),
    );
    expect(api.getCategories).toHaveBeenCalledTimes(2);
    expect(api.getExpenses).toHaveBeenCalledTimes(2);
  });
});
