"use client";

import { CapturePanel } from "@/components/capture-panel/capture-panel";
import { CategoryPanel } from "@/components/category-panel/category-panel";
import { ExpenseList } from "@/components/expense-list/expense-list";
import { Header } from "@/components/header/header";
import { SpendingSummary } from "@/components/spending-summary/spending-summary";
import { getLocale } from "@/i18n";
import type { TranslationKey } from "@/i18n";
import type { DashboardFixture, DashboardState } from "@/types/presentation";
import { buildSpendingItems } from "@/utils/spending";
import { useTranslation } from "react-i18next";

import { AppShell } from "./app-shell";
import { DashboardLayout } from "./dashboard-layout";
import { Footer } from "./footer";
import { ResultsPanel } from "./results-panel";

const categoryKeys: Readonly<Record<string, TranslationKey>> = {
  food: "food",
  transport: "transport",
  home: "home",
  fun: "fun",
};

const expenseKeys: Readonly<Record<string, TranslationKey>> = {
  "expense-lunch": "lunch",
  "expense-coffee": "coffee",
  "expense-taxi": "taxi",
};

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
  DashboardState,
  readonly [TranslationKey, TranslationKey, TranslationKey]
>;

export type DashboardPageProps = Readonly<{
  fixture: DashboardFixture;
}>;

export function DashboardPage({ fixture }: DashboardPageProps) {
  const { i18n, t } = useTranslation();
  const locale = getLocale(i18n.resolvedLanguage ?? i18n.language);
  const [titleKey, detailKey, mascotAltKey] = feedbackKeys[fixture.id];
  const localizedCategories = fixture.categories.map((category) => ({
    ...category,
    name: t(categoryKeys[category.id] ?? "categories"),
  }));
  const localizedExpenses = fixture.expenses.map((expense) => ({
    ...expense,
    description: t(expenseKeys[expense.id] ?? "recentExpenses"),
    categoryName: t(categoryKeys[expense.categoryId] ?? "categories"),
  }));
  const spendingItems = buildSpendingItems(localizedCategories);

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
                  ...fixture.feedback,
                  title: t(titleKey),
                  detail: t(detailKey),
                  mascotAlt: t(mascotAltKey),
                }}
                input={{
                  label: t("inputLabel"),
                  placeholder: t("inputPlaceholder"),
                  actionLabel: t("sortAction"),
                  value: fixture.inputValue ? t("sampleInput") : "",
                  disabled: fixture.id === "loading",
                }}
              />
            </div>
            <DashboardLayout
              categoryPanel={
                <CategoryPanel
                  locale={locale}
                  title={t("categories")}
                  addLabel={t("newCategory")}
                  categories={localizedCategories}
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
                      totalMinor={fixture.spending.totalMinor}
                      chartLabel={t("chartLabel")}
                      items={spendingItems}
                    />
                  }
                  expenseList={
                    <ExpenseList
                      locale={locale}
                      title={t("recentExpenses")}
                      periodLabel={t("today")}
                      expenses={localizedExpenses}
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
