"use client";

import { CapturePanel } from "@/components/capture-panel/capture-panel";
import type { RatDialogueState } from "@/components/capture-panel/rat-dialogue";
import { ExpenseList } from "@/components/expense-list/expense-list";
import { Header } from "@/components/header/header";
import { SpendingSummary } from "@/components/spending-summary/spending-summary";
import { mapCategoriesToItems } from "@/features/categories/category-display";
import { CategoryPanel } from "@/features/categories/components/category-panel";
import {
  mapCategorySpendingToItems,
  mapExpensesToListItems,
} from "@/features/expenses/expense-display";
import { useExpenseSession } from "@/features/expenses/use-expense-session";
import type { ExpenseSessionSeed } from "@/features/expenses/use-expense-session";
import { getLocale } from "@/i18n";
import type { TranslationKey } from "@/i18n";
import { useTranslation } from "react-i18next";

import { AppShell } from "./app-shell";
import { DashboardLayout } from "./dashboard-layout";
import { Footer } from "./footer";
import { ResultsPanel } from "./results-panel";

const feedbackKeys = {
  empty: ["emptyTitle", "emptyDetail", "emptyMascotAlt"],
  loading: ["loadingTitle", "loadingDetail", "loadingMascotAlt"],
  success: ["successTitle", "successDetail", "successMascotAlt"],
  "extraction-failure": [
    "extractionFailureTitle",
    "extractionFailureDetail",
    "extractionFailureMascotAlt",
  ],
  "provider-error": [
    "providerErrorTitle",
    "providerErrorDetail",
    "providerErrorMascotAlt",
  ],
} as const satisfies Record<
  RatDialogueState,
  readonly [TranslationKey, TranslationKey, TranslationKey]
>;

export type DashboardPageProps = Readonly<{
  initialSession?: ExpenseSessionSeed;
}>;

export function DashboardPage({ initialSession }: DashboardPageProps) {
  const { i18n, t } = useTranslation();
  const session = useExpenseSession(initialSession);
  const locale = getLocale(i18n.resolvedLanguage ?? i18n.language);
  const [titleKey, detailKey, mascotAltKey] =
    feedbackKeys[session.feedbackState];
  const categoryItems = mapCategoriesToItems(session.categories, t);
  const expenseListItems = mapExpensesToListItems(session.expenses, t);
  const categorySpendingItems = mapCategorySpendingToItems(
    session.categorySpending.items,
    t,
  );

  return (
    <div className="min-h-screen bg-[#151515] px-3 py-3 text-sm max-[680px]:px-0 max-[680px]:py-0">
      <div className="mx-auto w-full max-w-[1200px]">
        <AppShell label={t("appLabel")}>
          <Header
            appName={t("appName")}
            languageControl={{
              label: t("languageLabel"),
              locale,
              englishLabel: t("english"),
              spanishLabel: t("spanish"),
              onLocaleChange: (nextLocale) => {
                void i18n.changeLanguage(nextLocale);
              },
            }}
          />
          <main className="p-[22px] max-[680px]:p-[15px]">
            <div className="mb-[22px]">
              <CapturePanel
                dialogue={{
                  ...session.feedback,
                  title: t(titleKey),
                  detail: t(detailKey),
                  mascotAlt: t(mascotAltKey),
                }}
                input={{
                  label: t("inputLabel"),
                  placeholder: t("inputPlaceholder"),
                  actionLabel: t("sortAction"),
                  value: session.inputValue ? t("sampleInput") : "",
                  disabled: session.feedbackState === "loading",
                }}
              />
            </div>
            <DashboardLayout
              categoryPanel={
                <CategoryPanel
                  locale={locale}
                  categories={categoryItems}
                  onCreateCategory={session.createCategory}
                  onDeleteCategory={(categoryId) => {
                    session.deleteCategory(categoryId);
                  }}
                />
              }
              resultsPanel={
                <ResultsPanel
                  spendingSummary={
                    <SpendingSummary
                      locale={locale}
                      title={t("spending")}
                      periodLabel={t("thisMonth")}
                      totalLabel={t("total")}
                      totalMinor={session.categorySpending.totalMinor}
                      chartLabel={t("chartLabel")}
                      items={categorySpendingItems}
                    />
                  }
                  expenseList={
                    <ExpenseList
                      locale={locale}
                      title={t("recentExpenses")}
                      periodLabel={t("today")}
                      expenses={expenseListItems}
                    />
                  }
                />
              }
            />
          </main>
        </AppShell>
        <Footer
          poweredByLabel={t("poweredBy")}
          model="google/gemma-4-26b-a4b-it:free"
          sourceLabel={t("viewSource")}
          sourceAriaLabel={t("viewSourceAria")}
          sourceHref="https://github.com/Dkazarian/rat-app"
        />
      </div>
    </div>
  );
}
