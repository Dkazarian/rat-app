import type {
  CategoryItemData,
  DashboardFixture,
  DashboardState,
  ExpenseItemData,
  RatDialogueData,
} from "@/types/presentation";
import { buildSpendingItems, sumCategoryTotals } from "@/utils/spending";

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
    categoryId: "food",
    categoryName: "Food",
    color: "coral",
    amountMinor: 1_800,
  },
  {
    id: "expense-coffee",
    description: "Coffee",
    categoryId: "food",
    categoryName: "Food",
    color: "coral",
    amountMinor: 450,
  },
  {
    id: "expense-taxi",
    description: "Taxi",
    categoryId: "transport",
    categoryName: "Transport",
    color: "purple",
    amountMinor: 1_200,
  },
] as const satisfies ReadonlyArray<ExpenseItemData>;

const feedbackByState = {
  empty: {
    state: "empty",
    announcement: "polite",
    mascotSrc: "/assets/rat-mascot-awaiting.png",
  },
  loading: {
    state: "loading",
    announcement: "polite",
    mascotSrc: "/assets/rat-mascot-sniffing.png",
  },
  success: {
    state: "success",
    announcement: "polite",
    mascotSrc: "/assets/rat-mascot.png",
  },
  "extraction-failure": {
    state: "extraction-failure",
    announcement: "assertive",
    mascotSrc: "/assets/rat-mascot-confused.png",
  },
  "provider-error": {
    state: "provider-error",
    announcement: "assertive",
    mascotSrc: "/assets/rat-mascot-error.png",
  },
} as const satisfies Record<DashboardState, RatDialogueData>;

const submittedInput = "Lunch $18, coffee $4.50 and taxi $12";

function createFixture(
  state: DashboardState,
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
    spending: {
      totalMinor: sumCategoryTotals(fixtureCategories),
      items: buildSpendingItems(fixtureCategories),
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
} as const satisfies Record<DashboardState, DashboardFixture>;
