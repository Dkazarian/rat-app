"use client";

import { useId } from "react";
import type { FormEvent, Ref } from "react";
import { EXPENSE_PROMPT_MAX_LENGTH } from "@/contracts/session-api";
import { useLocale } from "@/i18n/locale-context";

export type ExpenseInputProps = Readonly<{
  value: string;
  inputRef?: Ref<HTMLTextAreaElement>;
  disabled?: boolean;
  validationCode?: "empty" | "too-long";
  onValueChange?: (value: string) => void;
  onSubmit?: () => void;
}>;

export function ExpenseInput({
  value,
  inputRef,
  disabled = false,
  validationCode,
  onValueChange,
  onSubmit,
}: ExpenseInputProps) {
  const inputId = useId();
  const { t } = useLocale();
  const validationId = validationCode ? `${inputId}-validation` : undefined;
  const validationMessage = validationCode
    ? t(
        validationCode === "empty"
          ? "promptValidationEmpty"
          : "promptValidationTooLong",
      )
    : undefined;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit?.();
  };

  return (
    <form onSubmit={handleSubmit} className="min-w-0">
      <label htmlFor={inputId} className="mb-[9px] block font-medium">
        {t("inputLabel")}
      </label>
      <div className="flex items-stretch gap-[10px] max-[681px]:flex-col">
        <textarea
          ref={inputRef}
          id={inputId}
          value={value}
          placeholder={t("inputPlaceholder")}
          maxLength={EXPENSE_PROMPT_MAX_LENGTH}
          disabled={disabled}
          aria-describedby={validationId}
          aria-invalid={validationMessage ? true : undefined}
          onChange={(event) => onValueChange?.(event.target.value)}
          className="min-h-[82px] min-w-0 flex-1 resize-y rounded-[14px] border border-[#49404f] bg-[#302a37] px-[14px] py-[13px] text-[#f7f2fa] outline-offset-2 placeholder:text-[#bbb1c1] focus-visible:outline-2 focus-visible:outline-[#86afe0] disabled:cursor-not-allowed disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={disabled}
          className="min-w-24 cursor-pointer rounded-[14px] border-0 bg-[#efe7f2] px-4 font-medium text-[#26222d] outline-offset-2 focus-visible:outline-2 focus-visible:outline-[#86afe0] disabled:cursor-not-allowed disabled:opacity-60 max-[681px]:min-h-[46px]"
        >
          {t("sortAction")}
        </button>
      </div>
      {validationMessage ? (
        <p id={validationId} className="mt-2 text-sm text-[#ff8b85]">
          {validationMessage}
        </p>
      ) : null}
    </form>
  );
}
