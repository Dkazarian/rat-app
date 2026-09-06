"use client";

import { useCallback, useRef, useState } from "react";
import { EXPENSE_PROMPT_MAX_LENGTH } from "@/contracts/session-api";
import { AppShell } from "@/components/layout/app-shell";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header/header";
import { CapturePanel } from "@/features/dashboard/components/capture-panel/capture-panel";
import type { RatDialogueFeedback } from "@/features/dashboard/components/capture-panel/rat-dialogue";
import { DashboardResults } from "./dashboard-results";
import {
  browserSessionApi,
  SessionApiError,
  type SessionApi,
} from "@/features/dashboard/api/session-api-client";
import { getApiErrorMessage } from "@/features/dashboard/api/error-messages";
import { useSessionBootstrap } from "@/features/dashboard/hooks/use-session-bootstrap";
import { useLocale } from "@/i18n/locale-context";

export type DashboardPageProps = Readonly<{ api?: SessionApi }>;

export function DashboardPage({ api = browserSessionApi }: DashboardPageProps) {
  const { t, locale } = useLocale();
  const {
    isReady: isSessionReady,
    error: sessionError,
    retry: retrySession,
  } = useSessionBootstrap(api);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [promptValidation, setPromptValidation] = useState<
    "empty" | "too-long"
  >();
  const [feedback, setFeedback] = useState<RatDialogueFeedback>({
    state: "empty",
  });
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [isMutating, setIsMutating] = useState(false);
  const mutationActive = useRef(false);

  const notifyDataChanged = useCallback(
    () => setRefreshCounter((value) => value + 1),
    [],
  );
  const runMutation = useCallback(
    async <T,>(mutation: () => Promise<T>): Promise<T> => {
      if (mutationActive.current) {
        throw new Error("A mutation is already in progress.");
      }
      mutationActive.current = true;
      setIsMutating(true);
      try {
        return await mutation();
      } finally {
        mutationActive.current = false;
        setIsMutating(false);
      }
    },
    [],
  );
  const handleOperationError = useCallback(
    (error: unknown) => {
      if (
        error instanceof SessionApiError &&
        error.code === "session_not_found"
      ) {
        retrySession();
        return;
      }
      setFeedback({ state: "provider-error", error });
    },
    [retrySession],
  );

  const submitPrompt = async () => {
    if (!isSessionReady || isMutating) return;
    const trimmed = inputValue.trim();
    if (!trimmed || inputValue.length > EXPENSE_PROMPT_MAX_LENGTH) {
      setPromptValidation(!trimmed ? "empty" : "too-long");
      inputRef.current?.focus();
      return;
    }
    setFeedback({ state: "loading" });
    try {
      const result = await runMutation(() =>
        api.submitPrompt(inputValue, locale),
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
      notifyDataChanged();
    } catch (error) {
      if (
        error instanceof SessionApiError &&
        error.code === "session_not_found"
      ) {
        retrySession();
        return;
      }
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
                feedback={feedback}
                inputValue={inputValue}
                inputRef={inputRef}
                validationCode={promptValidation}
                disabled={!isSessionReady || isMutating}
                onInputChange={(value) => {
                  setInputValue(value);
                  setPromptValidation(undefined);
                }}
                onSubmit={() => void submitPrompt()}
              />
            </div>
            {sessionError ? (
              <div
                role="alert"
                className="rounded-[20px] border border-[#49404f] bg-[#26222d] p-5"
              >
                <p>{getApiErrorMessage(sessionError, t)}</p>
                <button
                  type="button"
                  onClick={retrySession}
                  className="mt-3 rounded-[10px] border border-[#49404f] px-3 py-2"
                >
                  {t("retry")}
                </button>
              </div>
            ) : isSessionReady ? (
              <DashboardResults
                api={api}
                refreshCounter={refreshCounter}
                isMutating={isMutating}
                runMutation={runMutation}
                onDataChanged={notifyDataChanged}
                onSessionExpired={retrySession}
                onOperationError={handleOperationError}
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
