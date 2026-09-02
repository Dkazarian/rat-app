"use client";

import { useCallback, useMemo, useReducer, useRef } from "react";
import { createBrowserId } from "@/utils/create-browser-id";

import {
  createCategory as createCategoryValue,
  createInitialCategories,
} from "@/features/categories/category-rules";
import type {
  Category,
  CategoryCreationResult,
  CategoryId,
} from "@/features/categories/types";
import {
  addExpenseBatch,
  deleteExpense as deleteExpenseValue,
  reclassifyExpense as reclassifyExpenseValue,
} from "@/features/expenses/expense-rules";
import { selectExpenseSummary } from "@/features/expenses/expense-selectors";
import type {
  Expense,
  ExpenseBatchAdditionResult,
  ExpenseCandidate,
  ExpenseDeletionResult,
  ExpenseId,
  ExpenseReclassificationResult,
  ExpenseSummary,
} from "@/features/expenses/types";

import {
  deleteCategoryAndReassignExpenses,
  type CoordinatedCategoryDeletionResult,
} from "./session-rules";

export type PageFeedbackState =
  | Readonly<{ state: "empty" }>
  | Readonly<{ state: "loading" }>
  | Readonly<{ state: "success"; extractedCount: number }>
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

type PageSessionState = PageSessionSeed;

type PageSessionAction =
  | Readonly<{ type: "input-changed"; value: string }>
  | Readonly<{ type: "capture-applied"; result: ExpenseBatchAdditionResult }>
  | Readonly<{
      type: "expense-reclassified";
      result: ExpenseReclassificationResult;
    }>
  | Readonly<{ type: "expense-deleted"; result: ExpenseDeletionResult }>
  | Readonly<{ type: "category-created"; result: CategoryCreationResult }>
  | Readonly<{
      type: "category-deleted";
      result: CoordinatedCategoryDeletionResult;
    }>;

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
  deleteExpense: (expenseId: ExpenseId) => ExpenseDeletionResult;
  createCategory: (name: string) => CategoryCreationResult;
  deleteCategory: (categoryId: CategoryId) => CoordinatedCategoryDeletionResult;
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
      return action.result.ok
        ? {
            ...state,
            expenses: action.result.expenses,
            inputValue: "",
            feedback: {
              state: "success",
              extractedCount: action.result.addedExpenses.length,
            },
          }
        : { ...state, feedback: { state: "extraction-failure" } };
    case "expense-reclassified":
    case "expense-deleted":
      return action.result.ok
        ? { ...state, expenses: action.result.expenses }
        : state;
    case "category-created":
      return action.result.ok
        ? { ...state, categories: action.result.categories }
        : state;
    case "category-deleted":
      return action.result.ok
        ? {
            ...state,
            categories: action.result.categories,
            expenses: action.result.expenses,
          }
        : state;
  }
}

export function usePageSession(
  seed?: PageSessionSeed,
  dependencies: PageSessionDependencies = {},
): PageSession {
  const [state, dispatch] = useReducer(
    pageSessionReducer,
    seed,
    (initialSeed) => initialSeed ?? createInitialPageSessionSeed(),
  );
  // Intention callbacks return results synchronously. Track the latest queued
  // transition so multiple calls in one event cannot read a stale render.
  const pendingState = useRef(state);
  const commit = useCallback((action: PageSessionAction) => {
    pendingState.current = pageSessionReducer(pendingState.current, action);
    dispatch(action);
  }, []);
  const createCategoryId = dependencies.createCategoryId ?? createBrowserId;
  const createExpenseId = dependencies.createExpenseId ?? createBrowserId;
  const summary = useMemo(
    () => selectExpenseSummary(state.categories, state.expenses),
    [state.categories, state.expenses],
  );

  const changeInput = useCallback(
    (value: string) => {
      commit({ type: "input-changed", value });
    },
    [commit],
  );

  const captureExpenses = useCallback(
    (candidates: ReadonlyArray<CapturedExpenseCandidate>) => {
      const identifiedCandidates = candidates.map((candidate) => ({
        ...candidate,
        id: candidate.id ?? createExpenseId(),
      }));
      const result = addExpenseBatch(
        pendingState.current.expenses,
        pendingState.current.categories,
        identifiedCandidates,
      );
      commit({ type: "capture-applied", result });
      return result;
    },
    [createExpenseId, commit],
  );

  const reclassifyExpense = useCallback(
    (expenseId: ExpenseId, categoryId: CategoryId) => {
      const result = reclassifyExpenseValue(
        pendingState.current.expenses,
        pendingState.current.categories,
        {
          expenseId,
          categoryId,
        },
      );
      commit({ type: "expense-reclassified", result });
      return result;
    },
    [commit],
  );

  const deleteExpense = useCallback(
    (expenseId: ExpenseId) => {
      const result = deleteExpenseValue(
        pendingState.current.expenses,
        expenseId,
      );
      commit({ type: "expense-deleted", result });
      return result;
    },
    [commit],
  );

  const createCategory = useCallback(
    (name: string) => {
      const result = createCategoryValue(pendingState.current.categories, {
        id: createCategoryId(),
        name,
      });
      commit({ type: "category-created", result });
      return result;
    },
    [createCategoryId, commit],
  );

  const deleteCategory = useCallback(
    (categoryId: CategoryId) => {
      const result = deleteCategoryAndReassignExpenses(
        pendingState.current.categories,
        pendingState.current.expenses,
        categoryId,
      );
      commit({ type: "category-deleted", result });
      return result;
    },
    [commit],
  );

  return {
    ...state,
    summary,
    changeInput,
    captureExpenses,
    reclassifyExpense,
    deleteExpense,
    createCategory,
    deleteCategory,
  };
}
