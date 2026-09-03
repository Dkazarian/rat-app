"use client";

import { useCallback, useMemo, useReducer, useState } from "react";
import { createBrowserId } from "@/utils/create-browser-id";

import {
  CategoryService,
  createInitialCategories,
} from "@/features/categories/category-service";
import type {
  Category,
  CategoryCreationResult,
  CategoryDeletionResult,
  CategoryId,
} from "@/features/categories/types";
import { useCategories } from "@/features/categories/use-categories";
import { ExpenseService } from "@/features/expenses/expense-service";
import { selectExpenseSummary } from "@/features/expenses/expense-selectors";
import type {
  Expense,
  ExpenseBatchAdditionResult,
  ExpenseCandidate,
  ExpenseId,
  ExpenseReclassificationResult,
  ExpenseSummary,
} from "@/features/expenses/types";

export type PageFeedbackState =
  | Readonly<{ state: "empty" }>
  | Readonly<{ state: "loading" }>
  | Readonly<{
      state: "success";
      extractedCount: number;
      rejectedCount?: number;
    }>
  | Readonly<{ state: "extraction-failure" }>
  | Readonly<{ state: "provider-error" }>;

export type PageSessionSeed = Readonly<{
  categories: ReadonlyArray<Category>;
  expenses: ReadonlyArray<Expense>;
  inputValue: string;
  feedback: PageFeedbackState;
}>;

export type CapturedExpenseCandidate = Omit<ExpenseCandidate, "id"> &
  Readonly<{ id?: ExpenseId }>;

export type PageSessionDependencies = Readonly<{
  createCategoryId?: () => CategoryId;
  createExpenseId?: () => ExpenseId;
}>;

type PageSessionState = Omit<PageSessionSeed, "categories">;

type PageSessionAction =
  | Readonly<{ type: "input-changed"; value: string }>
  | Readonly<{ type: "capture-applied"; result: ExpenseBatchAdditionResult }>
  | Readonly<{
      type: "expense-reclassified";
      result: ExpenseReclassificationResult;
    }>
  | Readonly<{ type: "expense-deleted"; expenseId: ExpenseId }>
  | Readonly<{ type: "expenses-reassigned"; expenses: ReadonlyArray<Expense> }>;

export type PageSession = Readonly<{
  categories: ReadonlyArray<Category>;
  expenses: ReadonlyArray<Expense>;
  inputValue: string;
  feedback: PageFeedbackState;
  summary: ExpenseSummary;
  changeInput: (value: string) => void;
  captureExpenses: (
    candidates: ReadonlyArray<CapturedExpenseCandidate>,
  ) => ExpenseBatchAdditionResult;
  reclassifyExpense: (
    expenseId: ExpenseId,
    categoryId: CategoryId,
  ) => ExpenseReclassificationResult;
  deleteExpense: (expenseId: ExpenseId) => void;
  createCategory: (name: string) => CategoryCreationResult;
  reassignExpensesFromCategory: (
    categoryId: CategoryId,
  ) => ReadonlyArray<Expense>;
  deleteCategory: (categoryId: CategoryId) => CategoryDeletionResult;
}>;

export function createInitialPageSessionSeed(): PageSessionSeed {
  return {
    categories: createInitialCategories(),
    expenses: [],
    inputValue: "",
    feedback: { state: "empty" },
  };
}

function pageSessionReducer(
  state: PageSessionState,
  action: PageSessionAction,
): PageSessionState {
  switch (action.type) {
    case "input-changed":
      return { ...state, inputValue: action.value };
    case "capture-applied":
      if (action.result.added.length === 0) {
        return { ...state, feedback: { state: "extraction-failure" } };
      }
      return {
        ...state,
        expenses: [...state.expenses, ...action.result.added],
        inputValue: "",
        feedback: {
          state: "success",
          extractedCount: action.result.added.length,
          ...(action.result.errors.length > 0
            ? { rejectedCount: action.result.errors.length }
            : {}),
        },
      };
    case "expense-reclassified":
      return {
        ...state,
        expenses: state.expenses.map((expense) =>
          expense.id === action.result.id ? action.result : expense,
        ),
      };
    case "expense-deleted":
      return {
        ...state,
        expenses: state.expenses.filter(({ id }) => id !== action.expenseId),
      };
    case "expenses-reassigned": {
      if (action.expenses.length === 0) return state;
      const reclassified = new Map(
        action.expenses.map((expense) => [expense.id, expense]),
      );
      return {
        ...state,
        expenses: state.expenses.map(
          (expense) => reclassified.get(expense.id) ?? expense,
        ),
      };
    }
  }
}

export function usePageSession(
  seed?: PageSessionSeed,
  dependencies: PageSessionDependencies = {},
): PageSession {
  const [categoriesService] = useState(
    () =>
      new CategoryService({
        initialCategories: seed?.categories,
        createId: dependencies.createCategoryId,
      }),
  );
  const [expenseService] = useState(
    () =>
      new ExpenseService({
        initialExpenses: seed?.expenses,
        categories: categoriesService,
      }),
  );
  const {
    categories,
    createCategory: createSessionCategory,
    deleteCategory: deleteSessionCategory,
  } = useCategories(categoriesService);
  const [state, dispatch] = useReducer(
    pageSessionReducer,
    seed,
    (initialSeed): PageSessionState => ({
      expenses: initialSeed?.expenses ?? [],
      inputValue: initialSeed?.inputValue ?? "",
      feedback: initialSeed?.feedback ?? { state: "empty" },
    }),
  );
  const createExpenseId = dependencies.createExpenseId ?? createBrowserId;
  const summary = useMemo(
    () => selectExpenseSummary(categories, state.expenses),
    [categories, state.expenses],
  );

  const changeInput = useCallback((value: string) => {
    dispatch({ type: "input-changed", value });
  }, []);

  const captureExpenses = useCallback(
    (candidates: ReadonlyArray<CapturedExpenseCandidate>) => {
      const identifiedCandidates = candidates.map((candidate) => ({
        ...candidate,
        id: candidate.id ?? createExpenseId(),
      }));
      const result = expenseService.addExpenseBatch(identifiedCandidates);
      dispatch({ type: "capture-applied", result });
      return result;
    },
    [createExpenseId, expenseService],
  );

  const reclassifyExpense = useCallback(
    (expenseId: ExpenseId, categoryId: CategoryId) => {
      const result = expenseService.reclassifyExpense(expenseId, categoryId);
      dispatch({ type: "expense-reclassified", result });
      return result;
    },
    [expenseService],
  );

  const deleteExpense = useCallback(
    (expenseId: ExpenseId) => {
      expenseService.deleteExpense(expenseId);
      dispatch({ type: "expense-deleted", expenseId });
    },
    [expenseService],
  );

  const createCategory = useCallback(
    (name: string) => {
      const category = createSessionCategory(name);
      const result: CategoryCreationResult = {
        ok: true,
        category,
        categories: categoriesService.list(),
      };
      return result;
    },
    [categoriesService, createSessionCategory],
  );

  const reassignExpensesFromCategory = useCallback(
    (categoryId: CategoryId) => {
      const expenses = expenseService.reassignExpensesFromCategory(categoryId);
      dispatch({ type: "expenses-reassigned", expenses });
      return expenses;
    },
    [expenseService],
  );

  const deleteCategory = useCallback(
    (categoryId: CategoryId): CategoryDeletionResult => {
      reassignExpensesFromCategory(categoryId);
      const deletedCategory = deleteSessionCategory(categoryId);
      const result: CategoryDeletionResult = {
        ok: true,
        deletedCategory,
        categories: categoriesService.list(),
      };
      return result;
    },
    [categoriesService, deleteSessionCategory, reassignExpensesFromCategory],
  );

  return {
    ...state,
    categories,
    summary,
    changeInput,
    captureExpenses,
    reclassifyExpense,
    deleteExpense,
    createCategory,
    reassignExpensesFromCategory,
    deleteCategory,
  };
}
