"use client";
import type {
  PageSessionSeed,
  CapturedExpenseCandidate,
  PageSessionDependencies,
  PageSession,
} from "@/features/dashboard/types";

import { useCallback, useMemo, useReducer, useState } from "react";
import { SessionService } from "@/services/session/session-service";
import { UserStore } from "@/features/dashboard/user-store";
import type {
  CategoryDeletionResult,
  CategoryId,
} from "@/services/categories/types";
import { selectExpenseSummary } from "@/features/expenses/expense-selectors";
import type {
  Expense,
  ExpenseBatchAdditionResult,
  ExpenseId,
  ExpenseReclassificationResult,
} from "@/services/expenses/types";

type PageSessionState = Omit<PageSessionSeed, "categories" | "expenses"> &
  Readonly<{ expenses: ReadonlyArray<Expense> }>;

type PageSessionAction =
  | Readonly<{ type: "input-changed"; value: string }>
  | Readonly<{ type: "capture-applied"; result: ExpenseBatchAdditionResult }>
  | Readonly<{
      type: "expense-reclassified";
      result: ExpenseReclassificationResult;
    }>
  | Readonly<{ type: "expense-deleted"; expenseId: ExpenseId }>
  | Readonly<{ type: "expenses-reassigned"; expenses: ReadonlyArray<Expense> }>;

export function createInitialPageSessionSeed(): PageSessionSeed {
  return {
    categories: [],
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
  const [userStore] = useState(
    () =>
      new UserStore({
        userId: seed?.userId,
        createId: dependencies.createUserId,
      }),
  );
  const [sessionService] = useState(
    () =>
      new SessionService({
        userId: userStore.getOrCreateUserId(),
        initialCategories: seed?.categories,
        initialExpenses: seed?.expenses,
      }),
  );
  const [categories, setCategories] = useState(() =>
    sessionService.listCategories(),
  );
  const [state, dispatch] = useReducer(
    pageSessionReducer,
    seed,
    (initialSeed): PageSessionState => ({
      expenses: sessionService.listExpenses(),
      inputValue: initialSeed?.inputValue ?? "",
      feedback: initialSeed?.feedback ?? { state: "empty" },
    }),
  );
  const summary = useMemo(
    () => selectExpenseSummary(categories, state.expenses),
    [categories, state.expenses],
  );

  const changeInput = useCallback((value: string) => {
    dispatch({ type: "input-changed", value });
  }, []);

  const captureExpenses = useCallback(
    (candidates: ReadonlyArray<CapturedExpenseCandidate>) => {
      const result = sessionService.captureExpenses(candidates);
      dispatch({ type: "capture-applied", result });
      return result;
    },
    [sessionService],
  );

  const reclassifyExpense = useCallback(
    (expenseId: ExpenseId, categoryId: CategoryId) => {
      const result = sessionService.reclassifyExpense(expenseId, categoryId);
      dispatch({ type: "expense-reclassified", result });
      return result;
    },
    [sessionService],
  );

  const deleteExpense = useCallback(
    (expenseId: ExpenseId) => {
      sessionService.deleteExpense(expenseId);
      dispatch({ type: "expense-deleted", expenseId });
    },
    [sessionService],
  );

  const createCategory = useCallback(
    (name: string) => {
      const result = sessionService.createCategory(name);
      setCategories(result.categories);
      return result;
    },
    [sessionService],
  );

  const reassignExpensesFromCategory = useCallback(
    (categoryId: CategoryId) => {
      const expenses = sessionService.reassignExpensesFromCategory(categoryId);
      dispatch({ type: "expenses-reassigned", expenses });
      return expenses;
    },
    [sessionService],
  );

  const deleteCategory = useCallback(
    (categoryId: CategoryId): CategoryDeletionResult => {
      const result = sessionService.deleteCategory(categoryId);
      setCategories(result.categories);
      dispatch({
        type: "expenses-reassigned",
        expenses: result.reassignedExpenses,
      });
      return result;
    },
    [sessionService],
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
