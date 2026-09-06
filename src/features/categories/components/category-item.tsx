"use client";

import type { CategoryItemData } from "@/features/categories/view-types";
import { categoryColorValues } from "@/features/categories/category-color";
import { formatAmount } from "@/utils/format-amount";
import { useLocale } from "@/i18n/locale-context";

export type CategoryItemProps = Readonly<{
  category: CategoryItemData;
  disabled?: boolean;
  onDelete?: (categoryId: string) => void;
}>;

export function CategoryItem({
  category,
  onDelete,
  disabled = false,
}: CategoryItemProps) {
  const { t } = useLocale();
  return (
    <li className="grid grid-cols-[12px_minmax(0,1fr)_auto_auto] items-center gap-[9px] border-b border-[#49404f] py-[10px] last:border-b-0">
      <span
        aria-hidden="true"
        className="size-[10px] rounded-full"
        style={{ backgroundColor: categoryColorValues[category.color] }}
      />
      <span className="min-w-0 break-words">{category.name}</span>
      <span className="font-medium whitespace-nowrap tabular-nums">
        {formatAmount(category.totalMinor)}
      </span>
      {category.canDelete ? (
        <button
          type="button"
          disabled={disabled}
          aria-label={t("deleteCategory", { name: category.name })}
          onClick={() => category.id !== null && onDelete?.(category.id)}
          className="size-7 cursor-pointer rounded-lg border border-[#49404f] bg-[#302a37] text-[#bbb1c1] outline-offset-2 hover:text-[#f7f2fa] focus-visible:outline-2 focus-visible:outline-[#86afe0]"
        >
          <span aria-hidden="true">×</span>
        </button>
      ) : null}
    </li>
  );
}
