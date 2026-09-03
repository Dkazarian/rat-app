"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import type { CategoryId, CategoryNameValidationCode } from "../types";
import type { Locale } from "@/i18n";

import { CategoryValidationError } from "../category-errors";

import { CategoryForm } from "./category-form";
import { CategoryItem } from "./category-item";
import type { CategoryItemData } from "./category-item";

export type CategoryPanelProps = Readonly<{
  locale: Locale;
  categories: ReadonlyArray<CategoryItemData>;
  onCreateCategory: (name: string) => void;
  onDeleteCategory: (categoryId: CategoryId) => void;
}>;

export function CategoryPanel({
  locale,
  categories,
  onCreateCategory,
  onDeleteCategory,
}: CategoryPanelProps) {
  const { t } = useTranslation();
  const titleId = useId();
  const createButtonRef = useRef<HTMLButtonElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const hasOpenedFormRef = useRef(false);
  const [isCreating, setIsCreating] = useState(false);
  const [draft, setDraft] = useState("");
  const [validationCode, setValidationCode] =
    useState<CategoryNameValidationCode>();
  const validationMessages: Readonly<
    Record<CategoryNameValidationCode, string>
  > = {
    empty: t("categoryValidationEmpty"),
    "too-long": t("categoryValidationTooLong"),
    duplicate: t("categoryValidationDuplicate"),
    reserved: t("categoryValidationReserved"),
    "limit-reached": t("categoryValidationLimit"),
  };

  useEffect(() => {
    if (isCreating) {
      nameInputRef.current?.focus();
    } else if (hasOpenedFormRef.current) {
      createButtonRef.current?.focus();
    }
  }, [isCreating]);

  const closeForm = () => {
    setDraft("");
    setValidationCode(undefined);
    setIsCreating(false);
  };

  const submitDraft = () => {
    try {
      onCreateCategory(draft);
      closeForm();
    } catch (error) {
      if (!(error instanceof CategoryValidationError)) throw error;
      setValidationCode(error.code);
      nameInputRef.current?.focus();
    }
  };

  return (
    <aside
      aria-labelledby={titleId}
      className="min-w-0 rounded-[20px] border border-[#49404f] bg-[#26222d] p-[17px]"
    >
      <div className="mb-[15px] flex items-center justify-between gap-[10px]">
        <h2 id={titleId} className="font-medium">
          {t("categories")}
        </h2>
        {!isCreating ? (
          <button
            ref={createButtonRef}
            type="button"
            onClick={() => {
              hasOpenedFormRef.current = true;
              setIsCreating(true);
            }}
            className="cursor-pointer rounded-[10px] border border-[#49404f] bg-[#302a37] px-[9px] py-[7px] text-[#f7f2fa] outline-offset-2 focus-visible:outline-2 focus-visible:outline-[#86afe0]"
          >
            <span aria-hidden="true">+ </span>
            {t("newCategory")}
          </button>
        ) : null}
      </div>
      {isCreating ? (
        <CategoryForm
          draft={draft}
          label={t("categoryNameLabel")}
          placeholder={t("categoryNamePlaceholder")}
          addLabel={t("addCategory")}
          cancelLabel={t("cancelCategory")}
          validationCode={validationCode}
          validationMessages={validationMessages}
          inputRef={nameInputRef}
          onDraftChange={(nextDraft) => {
            setDraft(nextDraft);
            setValidationCode(undefined);
          }}
          onSubmit={submitDraft}
          onCancel={closeForm}
        />
      ) : null}
      <ul className="grid list-none gap-2 p-0">
        {categories.map((category) => (
          <CategoryItem
            key={category.id}
            category={category}
            locale={locale}
            deleteLabel={t("deleteCategory", { name: category.name })}
            onDelete={onDeleteCategory}
          />
        ))}
      </ul>
    </aside>
  );
}
