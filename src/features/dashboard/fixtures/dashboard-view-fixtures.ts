import type { CategoryItemData } from "@/features/categories/view-types";
import type {
  RatDialogueFeedback,
  RatDialogueState,
} from "@/features/dashboard/components/capture-panel/rat-dialogue";
import { ratDialogueStates } from "@/features/dashboard/components/capture-panel/rat-dialogue";
import type { ExpenseListItemData } from "@/features/expenses/view-types";
import type { CategorySpendingItemData } from "@/features/expenses/view-types";
import type { Locale } from "@/i18n";
import {
  buildCategorySpendingItems,
  sumCategorySpending,
} from "@/features/expenses/view-models/category-spending";

export const dashboardStates = ratDialogueStates;

export type DashboardFixture = Readonly<{
  id: RatDialogueState;
  locale: Locale;
  inputValue: string;
  feedback: RatDialogueFeedback;
  categories: ReadonlyArray<CategoryItemData>;
  categorySpending: Readonly<{
    totalMinor: number;
    items: ReadonlyArray<CategorySpendingItemData>;
  }>;
  expenses: ReadonlyArray<ExpenseListItemData>;
}>;

const categories = [
  { id: "food", name: "Food", color: "coral", totalMinor: 51_820 },
  {
    id: "transport",
    name: "Transport",
    color: "purple",
    totalMinor: 33_410,
  },
  { id: "home", name: "Home", color: "teal", totalMinor: 25_240 },
  { id: "fun", name: "Fun", color: "yellow", totalMinor: 17_980 },
] as const satisfies ReadonlyArray<CategoryItemData>;

const emptyCategories = categories.map((category) => ({
  ...category,
  totalMinor: 0,
})) satisfies ReadonlyArray<CategoryItemData>;

const expenses = [
  {
    id: "expense-lunch",
    description: "Lunch",
    categoryName: "Food",
    color: "coral",
    amountMinor: 1_800,
  },
  {
    id: "expense-coffee",
    description: "Coffee",
    categoryName: "Food",
    color: "coral",
    amountMinor: 450,
  },
  {
    id: "expense-taxi",
    description: "Taxi",
    categoryName: "Transport",
    color: "purple",
    amountMinor: 1_200,
  },
] as const satisfies ReadonlyArray<ExpenseListItemData>;

const feedbackByState = {
  empty: { state: "empty" },
  loading: { state: "loading" },
  success: {
    state: "success",
    extractedCount: 3,
  },
  "extraction-failure": {
    state: "extraction-failure",
    detailKey: "apiErrorNoExpensesExtracted",
  },
  "provider-error": {
    state: "provider-error",
    detailKey: "apiErrorServiceUnavailable",
  },
  "rate-limited": { state: "rate-limited" },
} as const satisfies Record<RatDialogueState, RatDialogueFeedback>;

const submittedInput = "Lunch $18, coffee $4.50 and taxi $12";

function createFixture(
  state: RatDialogueState,
  options: Readonly<{
    inputValue: string;
    populated: boolean;
  }>,
): DashboardFixture {
  const fixtureCategories = options.populated ? categories : emptyCategories;

  return {
    id: state,
    locale: "en",
    inputValue: options.inputValue,
    feedback: feedbackByState[state],
    categories: fixtureCategories,
    categorySpending: {
      totalMinor: sumCategorySpending(fixtureCategories),
      items: buildCategorySpendingItems(fixtureCategories),
    },
    expenses: options.populated ? expenses : [],
  };
}

export const dashboardFixtures = {
  empty: createFixture("empty", { inputValue: "", populated: false }),
  loading: createFixture("loading", {
    inputValue: submittedInput,
    populated: true,
  }),
  success: createFixture("success", {
    inputValue: submittedInput,
    populated: true,
  }),
  "extraction-failure": createFixture("extraction-failure", {
    inputValue: submittedInput,
    populated: false,
  }),
  "provider-error": createFixture("provider-error", {
    inputValue: submittedInput,
    populated: false,
  }),
  "rate-limited": createFixture("rate-limited", {
    inputValue: submittedInput,
    populated: false,
  }),
} as const satisfies Record<RatDialogueState, DashboardFixture>;
