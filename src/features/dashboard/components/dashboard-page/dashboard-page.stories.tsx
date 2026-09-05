import type { Meta, StoryObj } from "@storybook/nextjs-vite";
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
  createSession: async () => ({
    sessionId: "00000000-0000-4000-8000-000000000001",
  }),
  getCategories: async () => categories,
  createCategory: async (_sessionId, name) => ({
    category: { id: crypto.randomUUID(), name, color: "blue", totalMinor: 0 },
  }),
  deleteCategory: async () => undefined,
  getExpenses: async () => expenses,
  submitPrompt: async () => ({ expenses: [], rejectedCount: 0 }),
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
