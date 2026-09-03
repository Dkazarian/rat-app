import type { StoredCategory } from "@/server/domain/category-rules";
import type { StoredExpense } from "@/server/domain/expense-rules";

export const seedCategories = [
  {
    id: "10000000-0000-4000-8000-000000000001",
    name: "Food",
    color: "coral",
  },
  {
    id: "10000000-0000-4000-8000-000000000002",
    name: "Home",
    color: "purple",
  },
  {
    id: "10000000-0000-4000-8000-000000000003",
    name: "Transport",
    color: "teal",
  },
  {
    id: "10000000-0000-4000-8000-000000000004",
    name: "Health",
    color: "yellow",
  },
] as const satisfies ReadonlyArray<StoredCategory>;

export const seedExpenses = [
  {
    id: "20000000-0000-4000-8000-000000000001",
    description: "Lunch with groceries",
    amountMinor: 5_183,
    categoryId: seedCategories[0].id,
    createdAt: 1_750_000_000_000,
  },
  {
    id: "20000000-0000-4000-8000-000000000002",
    description: "Taxi home",
    amountMinor: 3_400,
    categoryId: seedCategories[2].id,
    createdAt: 1_750_000_001_000,
  },
  {
    id: "20000000-0000-4000-8000-000000000003",
    description: "Mystery purchase",
    amountMinor: 725,
    categoryId: null,
    createdAt: 1_750_000_002_000,
  },
] as const satisfies ReadonlyArray<StoredExpense>;

export const seedTotalMinor = seedExpenses.reduce(
  (total, expense) => total + expense.amountMinor,
  0,
);
