"use client";

import { useEffect } from "react";
import { QueryState } from "@/components/common/query-state";
import type { CategoryItemData } from "@/features/categories/view-types";
import { getApiErrorMessage } from "@/features/dashboard/api/error-messages";
import {
  SessionApiError,
  type SessionApi,
} from "@/features/dashboard/api/session-api-client";
import { ExpenseList } from "@/features/expenses/components/expense-list/expense-list";
import { useExpenseQuery } from "@/features/expenses/hooks/use-expense-query";
import type { ExpenseListItemData } from "@/features/expenses/view-types";
import { useLocale } from "@/i18n/locale-context";

export type ApiExpenseListProps = Readonly<{
  api: SessionApi;
  categories: ReadonlyArray<CategoryItemData>;
  refreshCounter: number;
  onSessionExpired: () => void;
}>;

export function ApiExpenseList({
  api,
  categories,
  refreshCounter,
  onSessionExpired,
}: ApiExpenseListProps) {
  const { t } = useLocale();
  const query = useExpenseQuery(api, refreshCounter);

  useEffect(() => {
    if (
      query.error instanceof SessionApiError &&
      query.error.code === "session_not_found"
    ) {
      onSessionExpired();
    }
  }, [query.error, onSessionExpired]);

  if (query.isLoading) return <QueryState message={t("loadingExpenses")} />;
  if (query.error) {
    return (
      <QueryState
        message={getApiErrorMessage(query.error, t)}
        retry={query.retry}
      />
    );
  }

  const categoryById = new Map(
    categories.map((category) => [category.id, category]),
  );
  const unclassified = categoryById.get(null)!;
  const expenses: ReadonlyArray<ExpenseListItemData> = (
    query.data?.expenses ?? []
  ).map((expense) => {
    const category = categoryById.get(expense.categoryId) ?? unclassified;
    return {
      id: expense.id,
      description: expense.description,
      amountMinor: expense.amountMinor,
      categoryName: category.name,
      color: category.color,
    };
  });

  return <ExpenseList expenses={expenses} />;
}
