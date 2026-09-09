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
import { getApiErrorTranslationKey } from "@/features/dashboard/api/error-messages";
import {
  mapPromptOutcomeToRatFeedback,
  type PromptApiErrorCode,
  type PromptApiOutcome,
} from "@/features/dashboard/components/capture-panel/prompt-feedback";
import { useLocale } from "@/i18n/locale-context";

export type DashboardPageProps = Readonly<{ api?: SessionApi }>;

function isPromptApiErrorCode(
  code: SessionApiError["code"],
): code is PromptApiErrorCode {
  return [
    "invalid_request",
    "session_not_found",
    "expense_limit_reached",
    "rate_limited",
    "no_expenses_extracted",
    "service_unavailable",
    "internal_error",
  ].includes(code as PromptApiErrorCode);
}

function promptOutcomeFromError(error: unknown): PromptApiOutcome {
  if (error instanceof SessionApiError && isPromptApiErrorCode(error.code)) {
    return { kind: "api-error", code: error.code };
  }
  return { kind: "unknown" };
}

export function DashboardPage({ api = browserSessionApi }: DashboardPageProps) {
  const { t, locale } = useLocale();
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
  const handleOperationError = useCallback((error: unknown) => {
    setFeedback({
      state: "provider-error",
      detailKey: getApiErrorTranslationKey(error),
    });
  }, []);
  const handleSessionExpired = useCallback(() => {
    setFeedback({
      state: "provider-error",
      detailKey: "apiErrorSessionNotFound",
    });
    notifyDataChanged();
  }, [notifyDataChanged]);
  const handleMutationError = useCallback(
    (error: unknown) => {
      if (
        error instanceof SessionApiError &&
        error.code === "session_not_found"
      ) {
        handleSessionExpired();
        return;
      }
      handleOperationError(error);
    },
    [handleOperationError, handleSessionExpired],
  );

  const submitPrompt = async () => {
    if (isMutating) return;
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
        setFeedback(
          mapPromptOutcomeToRatFeedback({
            kind: "api-error",
            code: "no_expenses_extracted",
          }),
        );
        return;
      }
      setInputValue("");
      setFeedback(
        mapPromptOutcomeToRatFeedback({ kind: "success", response: result }),
      );
      notifyDataChanged();
    } catch (error) {
      if (
        error instanceof SessionApiError &&
        error.code === "session_not_found"
      ) {
        handleSessionExpired();
      } else {
        setFeedback(
          mapPromptOutcomeToRatFeedback(promptOutcomeFromError(error)),
        );
      }
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
                disabled={isMutating}
                onInputChange={(value) => {
                  setInputValue(value);
                  setPromptValidation(undefined);
                }}
                onSubmit={() => void submitPrompt()}
              />
            </div>
            <DashboardResults
              api={api}
              refreshCounter={refreshCounter}
              isMutating={isMutating}
              runMutation={runMutation}
              onDataChanged={notifyDataChanged}
              onSessionExpired={handleSessionExpired}
              onOperationError={handleMutationError}
            />
          </main>
        </AppShell>
        <Footer
          poweredByLabel={t("poweredBy")}
          model="gpt-4.1-nano"
          sourceLabel={t("viewSource")}
          sourceAriaLabel={t("viewSourceAria")}
          sourceHref="https://github.com/Dkazarian/rat-app"
        />
      </div>
    </div>
  );
}
