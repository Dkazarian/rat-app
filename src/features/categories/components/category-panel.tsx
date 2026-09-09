"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useLocale } from "@/i18n/locale-context";

import { CategoryForm } from "./category-form";
import type { CategoryNameValidationCode } from "./category-form";
import { CategoryItem } from "./category-item";
import type { CategoryItemData } from "@/features/categories/view-types";
import { SessionApiError } from "@/features/dashboard/api/session-api-client";
import { CATEGORY_NAME_MAX_LENGTH } from "@/contracts/session-api";

export type CategoryPanelProps = Readonly<{
  categories: ReadonlyArray<CategoryItemData>;
  disabled?: boolean;
  onCreateCategory: (name: string) => Promise<void>;
  onDeleteCategory: (categoryId: string) => Promise<void>;
  onOperationError: (error: unknown) => void;
}>;

export function CategoryPanel({
  categories,
  onCreateCategory,
  onDeleteCategory,
  onOperationError,
  disabled = false,
}: CategoryPanelProps) {
  const { t } = useLocale();
  const titleId = useId();
  const createButtonRef = useRef<HTMLButtonElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const hasOpenedFormRef = useRef(false);
  const [isCreating, setIsCreating] = useState(false);
  const [draft, setDraft] = useState("");
  const [validationCode, setValidationCode] =
    useState<CategoryNameValidationCode>();
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

  const submitDraft = async () => {
    const name = draft.trim();
    if (!name || name.length > CATEGORY_NAME_MAX_LENGTH) {
      setValidationCode(!name ? "empty" : "too-long");
      nameInputRef.current?.focus();
      return;
    }
    try {
      await onCreateCategory(name);
      closeForm();
    } catch (error) {
      const code: CategoryNameValidationCode | undefined =
        error instanceof SessionApiError
          ? error.code === "category_name_duplicate"
            ? "duplicate"
            : error.code === "category_limit_reached"
              ? "limit-reached"
              : error.code === "invalid_category_name"
                ? "invalid"
                : undefined
          : undefined;
      if (!code) {
        onOperationError(error);
        return;
      }
      setValidationCode(code);
      nameInputRef.current?.focus();
    }
  };

  return (
    <aside
      aria-labelledby={titleId}
      className="flex h-full min-h-0 min-w-0 flex-col rounded-[20px] border border-[#49404f] bg-[#26222d] p-[17px] max-[851px]:h-auto"
    >
      <div className="mb-[15px] flex shrink-0 items-center justify-between gap-[10px]">
        <h2 id={titleId} className="font-medium">
          {t("categories")}
        </h2>
        {!isCreating ? (
          <button
            ref={createButtonRef}
            type="button"
            disabled={disabled}
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
          validationCode={validationCode}
          inputRef={nameInputRef}
          onDraftChange={(nextDraft) => {
            setDraft(nextDraft);
            setValidationCode(undefined);
          }}
          onSubmit={() => void submitDraft()}
          onCancel={closeForm}
        />
      ) : null}
      <ul className="-mx-1 grid min-h-0 flex-1 content-start list-none gap-2 overflow-y-auto px-1 py-0 max-[851px]:flex-none max-[851px]:overflow-visible">
        {categories.map((category) => (
          <CategoryItem
            key={category.id ?? "unclassified"}
            category={category}
            onDelete={async (categoryId) => {
              try {
                await onDeleteCategory(categoryId);
              } catch (error) {
                onOperationError(error);
              }
            }}
            disabled={disabled}
          />
        ))}
      </ul>
    </aside>
  );
}
