"use client";

import { useEffect } from "react";

import { CategoryPanel } from "@/features/categories/components/category-panel";
import { ExpenseList } from "@/features/expenses/components/expense-list/expense-list";
import { SpendingSummary } from "@/features/expenses/components/spending-summary/spending-summary";
import { useCategoryQuery } from "@/features/categories/hooks/use-category-query";
import { useExpenseQuery } from "@/features/expenses/hooks/use-expense-query";
import {
  SessionApiError,
  type SessionApi,
} from "@/features/dashboard/api/session-api-client";
import { getApiErrorMessage } from "@/features/dashboard/api/error-messages";
import type { CategoryItemData } from "@/features/categories/view-types";
import type {
  CategorySpendingItemData,
  ExpenseListItemData,
} from "@/features/expenses/view-types";
import { useLocale } from "@/i18n/locale-context";
import { formatAmount } from "@/utils/format-amount";

type MutationRunner = <T>(mutation: () => Promise<T>) => Promise<T>;

type Props = Readonly<{
  api: SessionApi;
  sessionId: string;
  refreshCounter: number;
  isMutating: boolean;
  runMutation: MutationRunner;
  onDataChanged: () => void;
  onSessionExpired: () => void;
}>;

function QueryState({
  message,
  retry,
}: Readonly<{ message: string; retry?: () => void }>) {
  return (
    <div className="rounded-[20px] border border-[#49404f] bg-[#26222d] p-5 text-[#bbb1c1]">
      <p role={retry ? "alert" : "status"}>{message}</p>
      {retry ? (
        <button
          type="button"
          onClick={retry}
          className="mt-3 rounded-[10px] border border-[#49404f] px-3 py-2 text-[#f7f2fa]"
        >
          Retry
        </button>
      ) : null}
    </div>
  );
}

function ApiExpenseList({
  api,
  sessionId,
  refreshCounter,
  categories,
  onSessionExpired,
}: Props & Readonly<{ categories: ReadonlyArray<CategoryItemData> }>) {
  const { t, locale } = useLocale();
  const query = useExpenseQuery(api, sessionId, refreshCounter);
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
        message={getApiErrorMessage(query.error, locale)}
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

  return (
    <ExpenseList
      title={t("recentExpenses")}
      periodLabel={t("today")}
      expenses={expenses}
      emptyMessage={t("noExpenses")}
    />
  );
}

export function DashboardResults(props: Props) {
  const {
    api,
    sessionId,
    refreshCounter,
    isMutating,
    runMutation,
    onDataChanged,
    onSessionExpired,
  } = props;
  const { t, locale } = useLocale();
  const query = useCategoryQuery(api, sessionId, refreshCounter, locale);
  useEffect(() => {
    if (
      query.error instanceof SessionApiError &&
      query.error.code === "session_not_found"
    ) {
      onSessionExpired();
    }
  }, [query.error, onSessionExpired]);
  if (query.isLoading) return <QueryState message={t("loadingCategories")} />;
  if (query.error) {
    return (
      <QueryState
        message={getApiErrorMessage(query.error, locale)}
        retry={query.retry}
      />
    );
  }

  const response = query.data!;
  const categories: ReadonlyArray<CategoryItemData> = [
    ...response.categories.map((category) => ({
      ...category,
      canDelete: true,
    })),
    {
      id: null,
      name: t("unclassified"),
      color: "muted" as const,
      totalMinor: response.unclassifiedTotalMinor,
      canDelete: false,
    },
  ];
  const spendingItems: ReadonlyArray<CategorySpendingItemData> = categories.map(
    (category) => ({
      categoryId: category.id,
      name: category.name,
      color: category.color,
      percent:
        response.totalMinor === 0
          ? 0
          : Math.round((category.totalMinor / response.totalMinor) * 100),
    }),
  );
  const nonZero = spendingItems.filter(({ percent }) => percent > 0);
  const chartLabel = `${t("spending")}: ${
    nonZero.length === 0
      ? t("noSpending")
      : nonZero.map(({ name, percent }) => `${name} ${percent}%`).join(", ")
  }. ${t("total")}: ${formatAmount(response.totalMinor)}`;

  const mutate = async (operation: () => Promise<unknown>) => {
    await runMutation(operation);
    onDataChanged();
  };

  return (
    <div className="grid grid-cols-[250px_minmax(0,1fr)] items-start gap-[18px] max-[850px]:grid-cols-1">
      <CategoryPanel
        categories={categories}
        disabled={isMutating}
        onCreateCategory={(name) =>
          mutate(() => api.createCategory(sessionId, name))
        }
        onDeleteCategory={(categoryId) =>
          mutate(() => api.deleteCategory(sessionId, categoryId))
        }
      />
      <div className="grid min-w-0 gap-[18px] rounded-[20px] border border-[#49404f] bg-[#26222d] p-[17px]">
        <SpendingSummary
          title={t("spending")}
          periodLabel={t("thisMonth")}
          totalLabel={t("total")}
          totalMinor={response.totalMinor}
          chartLabel={chartLabel}
          items={spendingItems}
        />
        <div className="border-t border-[#49404f] pt-[17px]">
          <ApiExpenseList {...props} categories={categories} />
        </div>
      </div>
    </div>
  );
}
