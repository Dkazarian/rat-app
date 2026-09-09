import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  categoryColors,
  type CategoriesResponse,
  type CategoryDto,
  type ExpenseDto,
} from "@/contracts/session-api";
import type { SessionApi } from "@/features/dashboard/api/session-api-client";
import { DashboardPage } from "./dashboard-page";

const categories = {
  categories: [
    {
      id: "10000000-0000-4000-8000-000000000001",
      name: "Food",
      color: "coral" as const,
      totalMinor: 5183,
    },
    {
      id: "10000000-0000-4000-8000-000000000002",
      name: "Home",
      color: "purple" as const,
      totalMinor: 0,
    },
    {
      id: "10000000-0000-4000-8000-000000000003",
      name: "Transport",
      color: "teal" as const,
      totalMinor: 3400,
    },
  ],
  unclassifiedTotalMinor: 725,
  totalMinor: 9308,
};
const expenses = {
  expenses: [
    {
      id: "20000000-0000-4000-8000-000000000003",
      description: "Mystery purchase",
      amountMinor: 725,
      categoryId: null,
      createdAt: 3,
    },
    {
      id: "20000000-0000-4000-8000-000000000002",
      description: "Taxi home",
      amountMinor: 3400,
      categoryId: categories.categories[2].id,
      createdAt: 2,
    },
    {
      id: "20000000-0000-4000-8000-000000000001",
      description: "Lunch with groceries",
      amountMinor: 5183,
      categoryId: categories.categories[0].id,
      createdAt: 1,
    },
  ],
};

const populatedApi: SessionApi = {
  getCategories: async () => categories,
  createCategory: async (name) => ({
    category: { id: crypto.randomUUID(), name, color: "blue", totalMinor: 0 },
  }),
  deleteCategory: async () => undefined,
  deleteExpense: async () => undefined,
  getExpenses: async () => expenses,
  submitPrompt: async () => ({
    expenses: [expenses.expenses[0]],
    rejectedCount: 0,
  }),
};
const emptyApi: SessionApi = {
  ...populatedApi,
  getCategories: async () => ({
    categories: [],
    unclassifiedTotalMinor: 0,
    totalMinor: 0,
  }),
  getExpenses: async () => ({ expenses: [] }),
};

function stableId(prefix: "1" | "2", index: number) {
  return `${prefix}0000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`;
}

function buildCategories(count: number): ReadonlyArray<CategoryDto> {
  return Array.from({ length: count }, (_, index) => ({
    id: stableId("1", index),
    name: `Category ${String(index + 1).padStart(2, "0")}`,
    color: categoryColors[index % categoryColors.length],
    totalMinor: (index + 1) * 100,
  }));
}

function buildExpenses(
  count: number,
  categories: ReadonlyArray<CategoryDto>,
): ReadonlyArray<ExpenseDto> {
  return Array.from({ length: count }, (_, index) => {
    const categoryIndex = index % (categories.length + 1);
    return {
      id: stableId("2", index),
      description: `Expense ${String(index + 1).padStart(2, "0")}`,
      amountMinor: (index + 1) * 125,
      categoryId:
        categoryIndex < categories.length ? categories[categoryIndex].id : null,
      createdAt: index + 1,
    };
  });
}

function createStoryApi(
  categoryCount: number,
  expenseCount: number,
): SessionApi {
  const baseCategories = buildCategories(categoryCount);
  const expenses = buildExpenses(expenseCount, baseCategories);
  const categoryTotals = new Map(
    baseCategories.map((category) => [category.id, 0]),
  );
  let unclassifiedTotalMinor = 0;
  let totalMinor = 0;
  for (const expense of expenses) {
    totalMinor += expense.amountMinor;
    if (expense.categoryId === null) {
      unclassifiedTotalMinor += expense.amountMinor;
    } else {
      categoryTotals.set(
        expense.categoryId,
        (categoryTotals.get(expense.categoryId) ?? 0) + expense.amountMinor,
      );
    }
  }
  const categories = baseCategories.map((category) => ({
    ...category,
    totalMinor: categoryTotals.get(category.id) ?? 0,
  }));
  const response: CategoriesResponse = {
    categories,
    unclassifiedTotalMinor,
    totalMinor,
  };
  const promptExpense = buildExpenses(
    Math.max(1, expenseCount),
    baseCategories,
  )[0];

  return {
    getCategories: async () => response,
    createCategory: async (name) => ({
      category: {
        id: "10000000-0000-4000-8000-000000000999",
        name,
        color: "blue",
        totalMinor: 0,
      },
    }),
    deleteCategory: async () => undefined,
    deleteExpense: async () => undefined,
    getExpenses: async () => ({ expenses }),
    submitPrompt: async () => ({
      expenses: [promptExpense],
      rejectedCount: 0,
    }),
  };
}

const meta = {
  title: "Pages/Dashboard",
  component: DashboardPage,
  parameters: { layout: "fullscreen" },
  args: { api: populatedApi },
} satisfies Meta<typeof DashboardPage>;
export default meta;
type Story = StoryObj<typeof meta>;
export const SeededDesktop: Story = {};
export const EmptyProduction: Story = { args: { api: emptyApi } };
export const Spanish: Story = { globals: { locale: "es" } };
export const Narrow: Story = {
  parameters: { viewport: { defaultViewport: "narrow" } },
};

export const ShortDesktop: Story = {
  args: { api: createStoryApi(3, 3) },
  parameters: { viewport: { defaultViewport: "desktop1200" } },
};
export const CategoryOverflow: Story = {
  args: { api: createStoryApi(10, 3) },
  parameters: { viewport: { defaultViewport: "desktopConstrained" } },
};
export const ExpenseOverflow: Story = {
  args: { api: createStoryApi(3, 24) },
  parameters: { viewport: { defaultViewport: "desktopConstrained" } },
};
export const BothListsOverflow: Story = {
  args: { api: createStoryApi(10, 24) },
  parameters: { viewport: { defaultViewport: "desktopConstrained" } },
};
export const BothListsOverflowSpanish: Story = {
  args: { api: createStoryApi(10, 24) },
  globals: { locale: "es" },
  parameters: { viewport: { defaultViewport: "desktopConstrained" } },
};
export const EmptyDesktop: Story = {
  args: { api: emptyApi },
  parameters: { viewport: { defaultViewport: "desktop1200" } },
};
export const ExactlyFittingDesktop: Story = {
  // At 1200 × 900, five categories and four expenses fit; adding the next item overflows.
  args: { api: createStoryApi(5, 4) },
  parameters: { viewport: { defaultViewport: "desktop1200" } },
};
export const NarrowLongLists: Story = {
  args: { api: createStoryApi(10, 24) },
  parameters: { viewport: { defaultViewport: "narrow" } },
};
export const NarrowCategoryInput: Story = {
  args: { api: createStoryApi(10, 3) },
  parameters: { viewport: { defaultViewport: "narrow" } },
};
