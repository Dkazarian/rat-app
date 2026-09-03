import type { Category } from "@/services/categories/types";
import type { Expense } from "@/services/expenses/types";

import type { PageSessionSeed } from "@/features/dashboard/types";

export const sampleCategories: ReadonlyArray<Category> = [
  {
    id: "food",
    kind: "custom",
    name: "Food",
    color: "coral",
    system: false,
  },
  {
    id: "home",
    kind: "custom",
    name: "Home",
    color: "purple",
    system: false,
  },
  {
    id: "transport",
    kind: "custom",
    name: "Transport",
    color: "teal",
    system: false,
  },
  {
    id: null,
    kind: "built-in",
    color: "muted",
    system: true,
  },
];

const categories: ReadonlyArray<Category> = [
  ...sampleCategories,
  {
    id: "fun",
    kind: "custom",
    name: "Fun",
    color: "yellow",
    system: false,
  },
];

const expenses: ReadonlyArray<Expense> = [
  {
    id: "expense-food",
    description: "Lunch and groceries",
    categoryId: "food",
    amountMinor: 51_820,
  },
  {
    id: "expense-home",
    description: "Home supplies",
    categoryId: "home",
    amountMinor: 25_240,
  },
  {
    id: "expense-transport",
    description: "Taxi and transit",
    categoryId: "transport",
    amountMinor: 33_410,
  },
  {
    id: "expense-fun",
    description: "Movie night",
    categoryId: "fun",
    amountMinor: 17_980,
  },
];

const submittedInput = "Lunch $18, coffee $4.50 and taxi $12";

const oneAcceptedExpense = expenses.slice(0, 1);
const cumulativeExpenses = expenses.slice(0, 2);
const reclassifiedExpenses = expenses.map((expense) =>
  expense.id === "expense-food" ? { ...expense, categoryId: "home" } : expense,
);
const categoryDeletedCategories = categories.filter(({ id }) => id !== "fun");
const categoryDeletedExpenses = expenses.map((expense) =>
  expense.categoryId === "fun" ? { ...expense, categoryId: null } : expense,
);

export const pageSessionFixtures = {
  empty: {
    categories: [],
    expenses: [],
    inputValue: "",
    feedback: { state: "empty" },
  },
  loading: {
    categories,
    expenses,
    inputValue: submittedInput,
    feedback: { state: "loading" },
  },
  success: {
    categories,
    expenses,
    inputValue: "",
    feedback: { state: "success", extractedCount: expenses.length },
  },
  "one-accepted-batch": {
    categories,
    expenses: oneAcceptedExpense,
    inputValue: "",
    feedback: {
      state: "success",
      extractedCount: oneAcceptedExpense.length,
    },
  },
  "cumulative-batches": {
    categories,
    expenses: cumulativeExpenses,
    inputValue: "",
    feedback: {
      state: "success",
      extractedCount: cumulativeExpenses.length,
    },
  },
  reclassified: {
    categories,
    expenses: reclassifiedExpenses,
    inputValue: "",
    feedback: { state: "success", extractedCount: expenses.length },
  },
  "expense-deleted": {
    categories,
    expenses: expenses.slice(1),
    inputValue: "",
    feedback: { state: "success", extractedCount: expenses.length },
  },
  "category-deleted": {
    categories: categoryDeletedCategories,
    expenses: categoryDeletedExpenses,
    inputValue: "",
    feedback: { state: "success", extractedCount: expenses.length },
  },
  "extraction-failure": {
    categories: [],
    expenses: [],
    inputValue: submittedInput,
    feedback: { state: "extraction-failure" },
  },
  "provider-error": {
    categories: [],
    expenses: [],
    inputValue: submittedInput,
    feedback: { state: "provider-error" },
  },
} as const satisfies Record<string, PageSessionSeed>;
