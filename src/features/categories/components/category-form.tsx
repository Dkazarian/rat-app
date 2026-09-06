"use client";

import { useId } from "react";
import type { Ref } from "react";
import { CATEGORY_NAME_MAX_LENGTH } from "@/contracts/session-api";
import { useLocale } from "@/i18n/locale-context";

export type CategoryNameValidationCode =
  "empty" | "too-long" | "duplicate" | "invalid" | "limit-reached";

export type CategoryFormProps = Readonly<{
  draft: string;
  validationCode?: CategoryNameValidationCode;
  inputRef?: Ref<HTMLInputElement>;
  onDraftChange: (draft: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}>;

export function CategoryForm({
  draft,
  validationCode,
  inputRef,
  onDraftChange,
  onSubmit,
  onCancel,
}: CategoryFormProps) {
  const inputId = useId();
  const { t } = useLocale();
  const errorId = `${inputId}-error`;
  const validationKeys = {
    empty: "categoryValidationEmpty",
    "too-long": "categoryValidationTooLong",
    duplicate: "categoryValidationDuplicate",
    invalid: "categoryValidationInvalid",
    "limit-reached": "categoryValidationLimit",
  } as const;

  return (
    <form
      className="mb-3 rounded-xl border border-[#49404f] bg-[#211d27] p-3"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <label htmlFor={inputId} className="mb-1.5 block text-[#ddd4e2]">
        {t("categoryNameLabel")}
      </label>
      <input
        ref={inputRef}
        id={inputId}
        value={draft}
        placeholder={t("categoryNamePlaceholder")}
        maxLength={CATEGORY_NAME_MAX_LENGTH}
        aria-invalid={validationCode ? true : undefined}
        aria-describedby={validationCode ? errorId : undefined}
        onChange={(event) => onDraftChange(event.target.value)}
        className="w-full rounded-[10px] border border-[#5c5362] bg-[#18151d] px-3 py-2 text-[#f7f2fa] outline-offset-2 placeholder:text-[#827886] focus-visible:outline-2 focus-visible:outline-[#86afe0]"
      />
      {validationCode ? (
        <p id={errorId} role="alert" className="mt-1.5 text-sm text-[#ffaaa0]">
          {t(validationKeys[validationCode])}
        </p>
      ) : null}
      <div className="mt-3 flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="cursor-pointer rounded-[10px] border border-[#49404f] px-3 py-2 outline-offset-2 focus-visible:outline-2 focus-visible:outline-[#86afe0]"
        >
          {t("cancelCategory")}
        </button>
        <button
          type="submit"
          className="cursor-pointer rounded-[10px] bg-[#7355a5] px-3 py-2 font-medium outline-offset-2 focus-visible:outline-2 focus-visible:outline-[#86afe0]"
        >
          {t("addCategory")}
        </button>
      </div>
    </form>
  );
}
