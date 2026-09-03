"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header/header";
import { CapturePanel } from "@/features/dashboard/components/capture-panel/capture-panel";
import type { RatDialogueState } from "@/features/dashboard/components/capture-panel/rat-dialogue";
import { DashboardResults } from "./dashboard-results";
import {
  browserSessionApi,
  SessionApiError,
  type SessionApi,
} from "@/features/dashboard/api/session-api-client";
import { getApiErrorMessage } from "@/features/dashboard/api/error-messages";
import { usePageSession } from "@/features/dashboard/hooks/use-page-session";
import type { TranslationKey } from "@/i18n";
import { useLocale } from "@/i18n/locale-context";

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

const feedbackData = {
  empty: {
    announcement: "polite",
    mascotSrc: "/assets/rat-mascot-awaiting.png",
  },
  loading: {
    announcement: "polite",
    mascotSrc: "/assets/rat-mascot-sniffing.png",
  },
  success: { announcement: "polite", mascotSrc: "/assets/rat-mascot.png" },
  "extraction-failure": {
    announcement: "assertive",
    mascotSrc: "/assets/rat-mascot-confused.png",
  },
  "provider-error": {
    announcement: "assertive",
    mascotSrc: "/assets/rat-mascot-error.png",
  },
} as const;

type Feedback = Readonly<{
  state: RatDialogueState;
  extractedCount?: number;
  rejectedCount?: number;
  error?: unknown;
}>;

export type DashboardPageProps = Readonly<{ api?: SessionApi }>;

export function DashboardPage({ api = browserSessionApi }: DashboardPageProps) {
  const { t, locale } = useLocale();
  const session = usePageSession(api);
  const [inputValue, setInputValue] = useState("");
  const [feedback, setFeedback] = useState<Feedback>({ state: "empty" });
  const [titleKey, detailKey, mascotAltKey] = feedbackKeys[feedback.state];
  const dialogueData = feedbackData[feedback.state];
  const detail =
    (feedback.error ? getApiErrorMessage(feedback.error, locale) : undefined) ??
    (feedback.state === "success"
      ? t(
          feedback.extractedCount === 1
            ? "successDetailOne"
            : "successDetailMany",
          {
            count: feedback.extractedCount,
          },
        ) +
        (feedback.rejectedCount
          ? ` ${t("skippedExpenses", { count: feedback.rejectedCount })}`
          : "")
      : t(detailKey));

  const submitPrompt = async () => {
    if (!session.sessionId || session.isMutating) return;
    setFeedback({ state: "loading" });
    try {
      const result = await session.runMutation(() =>
        api.submitPrompt(session.sessionId!, inputValue, locale),
      );
      if (result.expenses.length === 0) {
        setFeedback({ state: "extraction-failure" });
        return;
      }
      setInputValue("");
      setFeedback({
        state: "success",
        extractedCount: result.expenses.length,
        rejectedCount: result.rejectedCount,
      });
      session.notifyDataChanged();
    } catch (error) {
      setFeedback({
        state:
          error instanceof SessionApiError &&
          error.code === "classification_unavailable"
            ? "extraction-failure"
            : "provider-error",
        error,
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#151515] px-3 py-3 text-sm max-[680px]:px-0 max-[680px]:py-0">
      <div className="mx-auto w-full max-w-[1200px]">
        <AppShell label={t("appLabel")}>
          <Header appName={t("appName")} />
          <main className="p-[22px] max-[680px]:p-[15px]">
            <div className="mb-[22px]">
              <CapturePanel
                dialogue={{
                  state: feedback.state,
                  ...dialogueData,
                  title: t(titleKey),
                  detail,
                  mascotAlt: t(mascotAltKey),
                }}
                input={{
                  label: t("inputLabel"),
                  placeholder: t("inputPlaceholder"),
                  actionLabel: t("sortAction"),
                  value: inputValue,
                  disabled: !session.isReady || session.isMutating,
                  onValueChange: setInputValue,
                  onSubmit: () => void submitPrompt(),
                }}
              />
            </div>
            {session.error ? (
              <div
                role="alert"
                className="rounded-[20px] border border-[#49404f] bg-[#26222d] p-5"
              >
                <p>{getApiErrorMessage(session.error, locale)}</p>
                <button
                  type="button"
                  onClick={session.retry}
                  className="mt-3 rounded-[10px] border border-[#49404f] px-3 py-2"
                >
                  {t("retry")}
                </button>
              </div>
            ) : session.sessionId ? (
              <DashboardResults
                api={api}
                sessionId={session.sessionId}
                refreshCounter={session.refreshCounter}
                isMutating={session.isMutating}
                runMutation={session.runMutation}
                onDataChanged={session.notifyDataChanged}
                onSessionExpired={session.retry}
              />
            ) : (
              <p role="status" className="text-[#bbb1c1]">
                {t("loadingSession")}
              </p>
            )}
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
