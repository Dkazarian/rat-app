"use client";

import { useEffect } from "react";

import { QueryState } from "@/components/common/query-state";
import { CategoryPanel } from "@/features/categories/components/category-panel";
import { ApiExpenseList } from "@/features/expenses/components/api-expense-list";
import { SpendingSummary } from "@/features/expenses/components/spending-summary/spending-summary";
import { useCategoryQuery } from "@/features/categories/hooks/use-category-query";
import {
  SessionApiError,
  type SessionApi,
} from "@/features/dashboard/api/session-api-client";
import { getApiErrorMessage } from "@/features/dashboard/api/error-messages";
import type { CategoryItemData } from "@/features/categories/view-types";
import { buildCategorySpendingItems } from "@/features/expenses/view-models/category-spending";
import { useLocale } from "@/i18n/locale-context";

type MutationRunner = <T>(mutation: () => Promise<T>) => Promise<T>;

type Props = Readonly<{
  api: SessionApi;
  refreshCounter: number;
  isMutating: boolean;
  runMutation: MutationRunner;
  onDataChanged: () => void;
  onSessionExpired: () => void;
  onOperationError: (error: unknown) => void;
}>;

export function DashboardResults(props: Props) {
  const {
    api,
    refreshCounter,
    isMutating,
    runMutation,
    onDataChanged,
    onSessionExpired,
    onOperationError,
  } = props;
  const { t, locale } = useLocale();
  const query = useCategoryQuery(api, refreshCounter);
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
        message={getApiErrorMessage(query.error, t)}
        retry={query.retry}
      />
    );
  }

  const response = query.data!;
  const collator = new Intl.Collator(locale, { sensitivity: "base" });
  const categories: ReadonlyArray<CategoryItemData> = [
    ...response.categories
      .map((category) => ({ ...category, canDelete: true }))
      .sort((left, right) => collator.compare(left.name, right.name)),
    {
      id: null,
      name: t("unclassified"),
      color: "muted" as const,
      totalMinor: response.unclassifiedTotalMinor,
      canDelete: false,
    },
  ];
  const spendingItems = buildCategorySpendingItems(
    categories,
    response.totalMinor,
  );

  const mutate = async (operation: () => Promise<unknown>) => {
    await runMutation(operation);
    onDataChanged();
  };
  const handleCategoryError = (error: unknown) => {
    if (
      error instanceof SessionApiError &&
      error.code === "session_not_found"
    ) {
      onSessionExpired();
      return;
    }
    onOperationError(error);
  };

  return (
    <div className="grid grid-cols-[250px_minmax(0,1fr)] items-start gap-[18px] max-[850px]:grid-cols-1">
      <CategoryPanel
        categories={categories}
        disabled={isMutating}
        onCreateCategory={(name) => mutate(() => api.createCategory(name))}
        onDeleteCategory={(categoryId) =>
          mutate(() => api.deleteCategory(categoryId))
        }
        onOperationError={handleCategoryError}
      />
      <div className="grid min-w-0 gap-[18px] rounded-[20px] border border-[#49404f] bg-[#26222d] p-[17px]">
        <SpendingSummary
          totalMinor={response.totalMinor}
          items={spendingItems}
        />
        <div className="border-t border-[#49404f] pt-[17px]">
          <ApiExpenseList
            api={api}
            categories={categories}
            refreshCounter={refreshCounter}
            onSessionExpired={onSessionExpired}
          />
        </div>
      </div>
    </div>
  );
}
