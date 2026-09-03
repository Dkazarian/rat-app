"use client";

import { useId } from "react";
import type { Ref } from "react";

import type { CategoryNameValidationCode } from "@/services/categories/types";

export type CategoryFormProps = Readonly<{
  draft: string;
  label: string;
  placeholder: string;
  addLabel: string;
  cancelLabel: string;
  validationCode?: CategoryNameValidationCode;
  validationMessages: Readonly<Record<CategoryNameValidationCode, string>>;
  inputRef?: Ref<HTMLInputElement>;
  onDraftChange: (draft: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}>;

export function CategoryForm({
  draft,
  label,
  placeholder,
  addLabel,
  cancelLabel,
  validationCode,
  validationMessages,
  inputRef,
  onDraftChange,
  onSubmit,
  onCancel,
}: CategoryFormProps) {
  const inputId = useId();
  const errorId = `${inputId}-error`;

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
        {label}
      </label>
      <input
        ref={inputRef}
        id={inputId}
        value={draft}
        placeholder={placeholder}
        aria-invalid={validationCode ? true : undefined}
        aria-describedby={validationCode ? errorId : undefined}
        onChange={(event) => onDraftChange(event.target.value)}
        className="w-full rounded-[10px] border border-[#5c5362] bg-[#18151d] px-3 py-2 text-[#f7f2fa] outline-offset-2 placeholder:text-[#827886] focus-visible:outline-2 focus-visible:outline-[#86afe0]"
      />
      {validationCode ? (
        <p id={errorId} role="alert" className="mt-1.5 text-sm text-[#ffaaa0]">
          {validationMessages[validationCode]}
        </p>
      ) : null}
      <div className="mt-3 flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="cursor-pointer rounded-[10px] border border-[#49404f] px-3 py-2 outline-offset-2 focus-visible:outline-2 focus-visible:outline-[#86afe0]"
        >
          {cancelLabel}
        </button>
        <button
          type="submit"
          className="cursor-pointer rounded-[10px] bg-[#7355a5] px-3 py-2 font-medium outline-offset-2 focus-visible:outline-2 focus-visible:outline-[#86afe0]"
        >
          {addLabel}
        </button>
      </div>
    </form>
  );
}
