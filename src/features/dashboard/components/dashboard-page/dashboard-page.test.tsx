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
    createCategory: vi.fn(async (name) => {
      const category: CategoryDto = {
        id: "10000000-0000-4000-8000-000000000002",
        name: name.trim(),
        color: "purple",
        totalMinor: 0,
      };
      categories = [...categories, category];
      return { category };
    }),
    deleteCategory: vi.fn(async (id) => {
      categories = categories.filter((category) => category.id !== id);
      expenses = expenses.map((expense) =>
        expense.categoryId === id ? { ...expense, categoryId: null } : expense,
      );
    }),
    deleteExpense: vi.fn(async (id) => {
      expenses = expenses.filter((expense) => expense.id !== id);
    }),
    getExpenses: vi.fn(async () => ({ expenses })),
    submitPrompt: vi.fn(async () => {
      throw new SessionApiError(
        "no_expenses_extracted",
        "No expenses could be found.",
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
  it("disables sorting for empty and whitespace-only prompts", async () => {
    const api = createApi();
    const { user } = renderDashboard(api);
    const input = await screen.findByRole("textbox", {
      name: "What did you spend?",
    });
    const sortButton = screen.getByRole("button", { name: "Sort it" });

    expect(input).toHaveAttribute("maxLength", "500");
    expect(sortButton).toBeDisabled();

    await user.type(input, "   \n\t  ");

    expect(sortButton).toBeDisabled();
    expect(api.submitPrompt).not.toHaveBeenCalled();
  });

  it("trims and validates category names before calling the API", async () => {
    const api = createApi();
    const { user } = renderDashboard(api);
    const panel = within(
      await screen.findByRole("complementary", { name: "Categories" }),
    );
    await user.click(panel.getByRole("button", { name: "New" }));
    const input = panel.getByRole("textbox", { name: "Category name" });

    expect(input).toHaveAttribute("maxLength", "24");
    await user.click(panel.getByRole("button", { name: "Add" }));
    expect(panel.getByText("Enter a category name.")).toBeVisible();
    expect(input).toHaveFocus();
    expect(api.createCategory).not.toHaveBeenCalled();

    await user.type(input, "  Health  ");
    await user.click(panel.getByRole("button", { name: "Add" }));
    await waitFor(() =>
      expect(api.createCategory).toHaveBeenCalledWith("Health"),
    );
  });

  it("loads independent category and expense resources", async () => {
    const api = createApi();
    renderDashboard(api);
    expect(await screen.findByText("Lunch")).toBeVisible();
    expect(screen.getAllByText("Food")[0]).toBeVisible();
    expect(screen.getAllByText("Unclassified")[0]).toBeVisible();
    expect(api.getCategories).toHaveBeenCalledWith(expect.any(AbortSignal));
    expect(api.getExpenses).toHaveBeenCalledWith(expect.any(AbortSignal));
  });

  it("translates and re-sorts categories without refetching them", async () => {
    const api = createApi();
    const { user } = renderDashboard(api);
    await screen.findByText("Lunch");

    await user.click(screen.getByRole("button", { name: "Español" }));

    expect(await screen.findByText("Categorías")).toBeVisible();
    expect(api.getCategories).toHaveBeenCalledTimes(1);
  });

  it("preserves exact prompt text when no expense is extracted", async () => {
    const api = createApi();
    const { user } = renderDashboard(api);
    const input = await screen.findByRole("textbox", {
      name: "What did you spend?",
    });
    const exact = "  coffee???\n$4.50  ";
    await user.type(input, exact);
    await user.click(screen.getByRole("button", { name: "Sort it" }));
    await waitFor(() =>
      expect(api.submitPrompt).toHaveBeenCalledWith(exact, "en"),
    );
    expect(input).toHaveValue(exact);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Include what you bought and the amount.",
    );
  });

  it("preserves the draft and shows the tired rat when rate limited", async () => {
    const api = createApi();
    vi.mocked(api.submitPrompt).mockRejectedValueOnce(
      new SessionApiError("rate_limited", "Too many requests."),
    );
    const { user } = renderDashboard(api);
    const input = await screen.findByRole("textbox", {
      name: "What did you spend?",
    });
    const exact = "  Coffee $4.50  ";
    await user.type(input, exact);
    await user.click(screen.getByRole("button", { name: "Sort it" }));

    expect(await screen.findByText("AI is tired")).toBeVisible();
    expect(screen.getByText("Try again later.")).toBeVisible();
    expect(screen.getByRole("img", { name: "Tired rat mascot" })).toBeVisible();
    expect(input).toHaveValue(exact);
    expect(api.getCategories).toHaveBeenCalledTimes(1);
    expect(api.getExpenses).toHaveBeenCalledTimes(1);
  });

  it("clears and refreshes after partial success using ordinary success copy", async () => {
    const api = createApi();
    vi.mocked(api.submitPrompt).mockResolvedValueOnce({
      expenses: [
        {
          id: "20000000-0000-4000-8000-000000000002",
          description: "Coffee",
          amountMinor: 450,
          categoryId: null,
          createdAt: 2,
        },
      ],
      rejectedCount: 3,
    });
    const { user } = renderDashboard(api);
    const input = await screen.findByRole("textbox", {
      name: "What did you spend?",
    });
    await user.type(input, "Coffee $4.50");
    await user.click(screen.getByRole("button", { name: "Sort it" }));

    await waitFor(() => expect(input).toHaveValue(""));
    expect(screen.getByText("1 expense sorted.")).toBeVisible();
    expect(screen.queryByText(/skipped|rejected/i)).not.toBeInTheDocument();
    expect(api.getCategories).toHaveBeenCalledTimes(2);
    expect(api.getExpenses).toHaveBeenCalledTimes(2);
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

  it("deletes an expense and refreshes both dashboard resources", async () => {
    const api = createApi();
    const { user } = renderDashboard(api);
    const expenses = within(
      await screen.findByRole("region", { name: "Recent expenses" }),
    );

    await user.click(expenses.getByRole("button", { name: "Delete Lunch" }));

    await waitFor(() =>
      expect(api.deleteExpense).toHaveBeenCalledWith(
        "20000000-0000-4000-8000-000000000001",
      ),
    );
    await waitFor(() =>
      expect(expenses.queryByText("Lunch")).not.toBeInTheDocument(),
    );
    expect(api.getCategories).toHaveBeenCalledTimes(2);
    expect(api.getExpenses).toHaveBeenCalledTimes(2);
  });

  it("routes expense deletion failures through dashboard error feedback", async () => {
    const api = createApi();
    vi.mocked(api.deleteExpense).mockRejectedValueOnce(
      new SessionApiError(
        "service_unavailable",
        "The service is temporarily unavailable.",
      ),
    );
    const { user } = renderDashboard(api);
    const expenses = within(
      await screen.findByRole("region", { name: "Recent expenses" }),
    );

    await user.click(expenses.getByRole("button", { name: "Delete Lunch" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Service unavailable. Try again.",
    );
    expect(expenses.getByText("Lunch")).toBeVisible();
    expect(api.getCategories).toHaveBeenCalledTimes(1);
    expect(api.getExpenses).toHaveBeenCalledTimes(1);
  });

  it("routes non-validation category failures to localized feedback", async () => {
    const api = createApi();
    vi.mocked(api.createCategory).mockRejectedValueOnce(
      new SessionApiError(
        "service_unavailable",
        "The service is temporarily unavailable.",
      ),
    );
    const { user } = renderDashboard(api);
    const panel = within(
      await screen.findByRole("complementary", { name: "Categories" }),
    );
    await user.click(panel.getByRole("button", { name: "New" }));
    await user.type(
      panel.getByRole("textbox", { name: "Category name" }),
      "Health",
    );

    await user.click(panel.getByRole("button", { name: "Add" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Service unavailable. Try again.",
    );
    expect(panel.getByRole("textbox", { name: "Category name" })).toHaveValue(
      "Health",
    );
  });

  it("shows generic localized feedback for server-side invalid names", async () => {
    const api = createApi();
    vi.mocked(api.createCategory).mockRejectedValueOnce(
      new SessionApiError(
        "invalid_category_name",
        "This English server detail must not be inspected.",
        "name",
      ),
    );
    const { user } = renderDashboard(api);
    const panel = within(
      await screen.findByRole("complementary", { name: "Categories" }),
    );
    await user.click(panel.getByRole("button", { name: "New" }));
    await user.type(
      panel.getByRole("textbox", { name: "Category name" }),
      "Reserved",
    );

    await user.click(panel.getByRole("button", { name: "Add" }));

    expect(await panel.findByRole("alert")).toHaveTextContent(
      "Enter a valid category name.",
    );
    expect(panel.getByRole("alert")).not.toHaveTextContent("English server");
  });

  it("preserves a prompt draft and refreshes empty state after expiration", async () => {
    const api = createApi();
    const emptyCategories = {
      categories: [],
      unclassifiedTotalMinor: 0,
      totalMinor: 0,
    };
    vi.mocked(api.submitPrompt).mockRejectedValueOnce(
      new SessionApiError(
        "session_not_found",
        "The session is unavailable or has expired.",
      ),
    );
    const { user } = renderDashboard(api);
    await screen.findByText("Lunch");
    vi.mocked(api.getCategories).mockResolvedValue(emptyCategories);
    vi.mocked(api.getExpenses).mockResolvedValue({ expenses: [] });

    const input = screen.getByRole("textbox", { name: "What did you spend?" });
    const exact = "  coffee???\n$4.50  ";
    await user.type(input, exact);
    await user.click(screen.getByRole("button", { name: "Sort it" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Session expired. Continue to start fresh.",
    );
    expect(input).toHaveValue(exact);
    await waitFor(() => {
      expect(api.getCategories).toHaveBeenCalledTimes(2);
      expect(api.getExpenses).toHaveBeenCalledTimes(2);
      expect(screen.queryByText("Lunch")).not.toBeInTheDocument();
      expect(screen.queryByText("Food")).not.toBeInTheDocument();
    });
    expect(api.submitPrompt).toHaveBeenCalledTimes(1);

    vi.mocked(api.submitPrompt).mockResolvedValueOnce({
      expenses: [
        {
          id: "20000000-0000-4000-8000-000000000002",
          description: "Coffee",
          amountMinor: 450,
          categoryId: null,
          createdAt: 2,
        },
      ],
      rejectedCount: 0,
    });
    await user.click(screen.getByRole("button", { name: "Sort it" }));

    await waitFor(() => expect(api.submitPrompt).toHaveBeenCalledTimes(2));
    expect(input).toHaveValue("");
  });

  it("preserves a category draft and does not retry creation after expiration", async () => {
    const api = createApi();
    vi.mocked(api.createCategory).mockRejectedValueOnce(
      new SessionApiError(
        "session_not_found",
        "The session is unavailable or has expired.",
      ),
    );
    const { user } = renderDashboard(api);
    await screen.findByText("Lunch");
    vi.mocked(api.getCategories).mockResolvedValue({
      categories: [],
      unclassifiedTotalMinor: 0,
      totalMinor: 0,
    });
    vi.mocked(api.getExpenses).mockResolvedValue({ expenses: [] });

    const panel = within(
      screen.getByRole("complementary", { name: "Categories" }),
    );
    await user.click(panel.getByRole("button", { name: "New" }));
    const input = panel.getByRole("textbox", { name: "Category name" });
    const exact = "  Health  ";
    await user.type(input, exact);
    await user.click(panel.getByRole("button", { name: "Add" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Session expired. Continue to start fresh.",
    );
    expect(input).toHaveValue(exact);
    await waitFor(() => {
      expect(api.getCategories).toHaveBeenCalledTimes(2);
      expect(api.getExpenses).toHaveBeenCalledTimes(2);
      expect(screen.queryByText("Lunch")).not.toBeInTheDocument();
    });
    expect(api.createCategory).toHaveBeenCalledTimes(1);

    await user.click(panel.getByRole("button", { name: "Add" }));
    await waitFor(() => expect(api.createCategory).toHaveBeenCalledTimes(2));
  });

  it("refreshes stale data after an expired expense delete and allows a later prompt", async () => {
    const api = createApi();
    vi.mocked(api.deleteExpense).mockRejectedValueOnce(
      new SessionApiError(
        "session_not_found",
        "The session is unavailable or has expired.",
      ),
    );
    const { user } = renderDashboard(api);
    const expenses = within(
      await screen.findByRole("region", { name: "Recent expenses" }),
    );
    vi.mocked(api.getCategories).mockResolvedValue({
      categories: [],
      unclassifiedTotalMinor: 0,
      totalMinor: 0,
    });
    vi.mocked(api.getExpenses).mockResolvedValue({ expenses: [] });

    await user.click(expenses.getByRole("button", { name: "Delete Lunch" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Session expired. Continue to start fresh.",
    );
    await waitFor(() => {
      expect(api.deleteExpense).toHaveBeenCalledTimes(1);
      expect(api.getCategories).toHaveBeenCalledTimes(2);
      expect(api.getExpenses).toHaveBeenCalledTimes(2);
      expect(screen.queryByText("Lunch")).not.toBeInTheDocument();
    });

    vi.mocked(api.submitPrompt).mockResolvedValueOnce({
      expenses: [
        {
          id: "20000000-0000-4000-8000-000000000002",
          description: "Coffee",
          amountMinor: 450,
          categoryId: null,
          createdAt: 2,
        },
      ],
      rejectedCount: 0,
    });
    const input = screen.getByRole("textbox", { name: "What did you spend?" });
    await user.type(input, "Coffee $4.50");
    await user.click(screen.getByRole("button", { name: "Sort it" }));
    await waitFor(() => expect(api.submitPrompt).toHaveBeenCalledTimes(1));
  });

  it("refreshes stale data after an expired category delete and allows a later category", async () => {
    const api = createApi();
    vi.mocked(api.deleteCategory).mockRejectedValueOnce(
      new SessionApiError(
        "session_not_found",
        "The session is unavailable or has expired.",
      ),
    );
    const { user } = renderDashboard(api);
    await screen.findByText("Lunch");
    vi.mocked(api.getCategories).mockResolvedValue({
      categories: [],
      unclassifiedTotalMinor: 0,
      totalMinor: 0,
    });
    vi.mocked(api.getExpenses).mockResolvedValue({ expenses: [] });

    const panel = within(
      screen.getByRole("complementary", { name: "Categories" }),
    );
    await user.click(panel.getByRole("button", { name: "Delete Food" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Session expired. Continue to start fresh.",
    );
    await waitFor(() => {
      expect(api.deleteCategory).toHaveBeenCalledTimes(1);
      expect(api.getCategories).toHaveBeenCalledTimes(2);
      expect(api.getExpenses).toHaveBeenCalledTimes(2);
      expect(screen.queryByText("Lunch")).not.toBeInTheDocument();
      expect(screen.queryByText("Food")).not.toBeInTheDocument();
    });

    await user.click(panel.getByRole("button", { name: "New" }));
    await user.type(
      panel.getByRole("textbox", { name: "Category name" }),
      "Health",
    );
    await user.click(panel.getByRole("button", { name: "Add" }));
    await waitFor(() =>
      expect(api.createCategory).toHaveBeenCalledWith("Health"),
    );
  });
});
