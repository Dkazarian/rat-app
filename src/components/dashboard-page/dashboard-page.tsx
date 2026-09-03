"use client";

import { CapturePanel } from "@/components/capture-panel/capture-panel";
import type { RatDialogueState } from "@/components/capture-panel/rat-dialogue";
import { ExpenseList } from "@/components/expense-list/expense-list";
import { Header } from "@/components/header/header";
import { SpendingSummary } from "@/components/spending-summary/spending-summary";
import { CategoryPanel } from "@/features/categories/components/category-panel";
import {
  buildSpendingChartLabel,
  mapExpenseSummaryToCategoryItems,
  mapExpenseSummaryToSpendingItems,
  mapExpenseValuesToListItems,
} from "@/features/expenses/expense-display";
import type { CapturedExpenseCandidate } from "@/features/session/use-page-session";
import {
  usePageSession,
  type PageSessionDependencies,
  type PageSessionSeed,
} from "@/features/session/use-page-session";
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
  initialSession?: PageSessionSeed;
  sessionDependencies?: PageSessionDependencies;
  produceExpenseBatch?: (
    inputValue: string,
  ) => ReadonlyArray<CapturedExpenseCandidate>;
}>;

const feedbackData = {
  empty: {
    announcement: "polite",
    mascotSrc: "/assets/rat-mascot-awaiting.png",
  },
  loading: {
    announcement: "polite",
    mascotSrc: "/assets/rat-mascot-sniffing.png",
  },
  success: {
    announcement: "polite",
    mascotSrc: "/assets/rat-mascot.png",
  },
  "extraction-failure": {
    announcement: "assertive",
    mascotSrc: "/assets/rat-mascot-confused.png",
  },
  "provider-error": {
    announcement: "assertive",
    mascotSrc: "/assets/rat-mascot-error.png",
  },
} as const;

const rejectCapture = () => [];

export function DashboardPage({
  initialSession,
  sessionDependencies,
  produceExpenseBatch = rejectCapture,
}: DashboardPageProps) {
  const { i18n, t } = useTranslation();
  const session = usePageSession(initialSession, sessionDependencies);
  const locale = getLocale(i18n.resolvedLanguage ?? i18n.language);
  const [titleKey, detailKey, mascotAltKey] =
    feedbackKeys[session.feedback.state];
  const dialogueData = feedbackData[session.feedback.state];
  const categoryItems = mapExpenseSummaryToCategoryItems(session.summary, t);
  const categoryOptions = categoryItems.map(({ id, name }) => ({ id, name }));
  const expenseListItems = mapExpenseValuesToListItems(
    session.expenses,
    session.categories,
    t,
  );
  const categorySpendingItems = mapExpenseSummaryToSpendingItems(
    session.summary,
    t,
  );
  const detail =
    session.feedback.state === "success"
      ? t(
          session.feedback.extractedCount === 1
            ? "successDetailOne"
            : "successDetailMany",
          { count: session.feedback.extractedCount },
        )
      : t(detailKey);

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
                  state: session.feedback.state,
                  ...dialogueData,
                  title: t(titleKey),
                  detail:
                    session.feedback.state === "success" &&
                    session.feedback.rejectedCount
                      ? detail +
                        " " +
                        t("skippedExpenses", {
                          count: session.feedback.rejectedCount,
                        })
                      : detail,
                  mascotAlt: t(mascotAltKey),
                }}
                input={{
                  label: t("inputLabel"),
                  placeholder: t("inputPlaceholder"),
                  actionLabel: t("sortAction"),
                  value: session.inputValue,
                  disabled: session.feedback.state === "loading",
                  onValueChange: session.changeInput,
                  onSubmit: () => {
                    session.captureExpenses(
                      produceExpenseBatch(session.inputValue),
                    );
                  },
                }}
              />
            </div>
            <DashboardLayout
              categoryPanel={
                <CategoryPanel
                  locale={locale}
                  categories={categoryItems}
                  onCreateCategory={session.createCategory}
                  onDeleteCategory={session.deleteCategory}
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
                      totalMinor={session.summary.totalMinor}
                      chartLabel={buildSpendingChartLabel(
                        session.summary,
                        locale,
                        t,
                      )}
                      items={categorySpendingItems}
                    />
                  }
                  expenseList={
                    <ExpenseList
                      locale={locale}
                      title={t("recentExpenses")}
                      periodLabel={t("today")}
                      expenses={expenseListItems}
                      categoryOptions={categoryOptions}
                      emptyMessage={t("noExpenses")}
                      getCategorySelectLabel={(expense) =>
                        t("reclassifyExpense", {
                          description: expense.description,
                        })
                      }
                      getDeleteLabel={(expense) =>
                        t("deleteExpense", {
                          description: expense.description,
                        })
                      }
                      onCategoryChange={session.reclassifyExpense}
                      onDeleteExpense={session.deleteExpense}
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
