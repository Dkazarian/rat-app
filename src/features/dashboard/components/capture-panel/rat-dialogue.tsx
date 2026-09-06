"use client";

import { getApiErrorMessage } from "@/features/dashboard/api/error-messages";
import type { TranslationKey } from "@/i18n";
import { useLocale } from "@/i18n/locale-context";

export const ratDialogueStates = [
  "empty",
  "loading",
  "success",
  "extraction-failure",
  "provider-error",
] as const;

export type RatDialogueState = (typeof ratDialogueStates)[number];

export type RatDialogueFeedback =
  | Readonly<{ state: "empty" | "loading" }>
  | Readonly<{
      state: "success";
      extractedCount: number;
      rejectedCount: number;
    }>
  | Readonly<{
      state: "extraction-failure" | "provider-error";
      error?: unknown;
    }>;

export type RatDialogueProps = Readonly<{
  feedback: RatDialogueFeedback;
}>;

const titleKeys = {
  empty: "emptyTitle",
  loading: "loadingTitle",
  success: "successTitle",
  "extraction-failure": "extractionFailureTitle",
  "provider-error": "providerErrorTitle",
} as const satisfies Record<RatDialogueState, TranslationKey>;

const detailKeys = {
  empty: "emptyDetail",
  loading: "loadingDetail",
  "extraction-failure": "extractionFailureDetail",
  "provider-error": "providerErrorDetail",
} as const satisfies Record<
  Exclude<RatDialogueState, "success">,
  TranslationKey
>;

export function RatDialogue({ feedback }: RatDialogueProps) {
  const { t } = useLocale();
  const isUrgent =
    feedback.state === "extraction-failure" ||
    feedback.state === "provider-error";
  const detail = (() => {
    if (feedback.state === "success") {
      const result = t(
        feedback.extractedCount === 1
          ? "successDetailOne"
          : "successDetailMany",
        { count: feedback.extractedCount },
      );
      return feedback.rejectedCount
        ? `${result} ${t("skippedExpenses", { count: feedback.rejectedCount })}`
        : result;
    }
    if (
      (feedback.state === "extraction-failure" ||
        feedback.state === "provider-error") &&
      feedback.error
    ) {
      return getApiErrorMessage(feedback.error, t);
    }
    return t(detailKeys[feedback.state]);
  })();

  return (
    <div
      role={isUrgent ? "alert" : undefined}
      aria-live={isUrgent ? undefined : "polite"}
      data-state={feedback.state}
      className="relative min-w-0 self-start rounded-[18px_18px_18px_5px] border border-[#49404f] bg-[#26222d] px-[14px] py-[13px] before:absolute before:bottom-[10px] before:left-[-9px] before:size-4 before:rotate-45 before:border-b before:border-l before:border-[#49404f] before:bg-[#26222d] before:content-['']"
    >
      <p className="relative z-10 mb-[3px] font-medium">
        {t(titleKeys[feedback.state])}
      </p>
      <p className="relative z-10 text-[#bbb1c1]">{detail}</p>
    </div>
  );
}
