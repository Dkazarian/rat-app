"use client";

import type { TranslationKey } from "@/i18n";
import { useLocale } from "@/i18n/locale-context";

export const ratDialogueStates = [
  "empty",
  "loading",
  "success",
  "extraction-failure",
  "provider-error",
  "rate-limited",
] as const;

export type RatDialogueState = (typeof ratDialogueStates)[number];

export type RatDialogueFeedback =
  | Readonly<{ state: "empty" | "loading" | "rate-limited" }>
  | Readonly<{
      state: "success";
      extractedCount: number;
    }>
  | Readonly<{
      state: "extraction-failure" | "provider-error";
      detailKey: TranslationKey;
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
  "rate-limited": "rateLimitedTitle",
} as const satisfies Record<RatDialogueState, TranslationKey>;

const detailKeys = {
  empty: "emptyDetail",
  loading: "loadingDetail",
  "extraction-failure": "extractionFailureDetail",
  "provider-error": "providerErrorDetail",
  "rate-limited": "rateLimitedDetail",
} as const satisfies Record<
  Exclude<RatDialogueState, "success">,
  TranslationKey
>;

export function RatDialogue({ feedback }: RatDialogueProps) {
  const { t } = useLocale();
  const isUrgent =
    feedback.state === "extraction-failure" ||
    feedback.state === "provider-error" ||
    feedback.state === "rate-limited";
  const detail = (() => {
    if (feedback.state === "success") {
      const result = t(
        feedback.extractedCount === 1
          ? "successDetailOne"
          : "successDetailMany",
        { count: feedback.extractedCount },
      );
      return result;
    }
    if (
      feedback.state === "extraction-failure" ||
      feedback.state === "provider-error"
    ) {
      return t(feedback.detailKey);
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
