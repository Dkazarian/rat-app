"use client";

import { useId } from "react";

import { CategoryItem } from "./category-item";
import type { CategoryItemData } from "./category-item";
import type { Locale } from "@/i18n";

export type CategoryPanelProps = Readonly<{
  locale: Locale;
  title: string;
  addLabel: string;
  categories: ReadonlyArray<CategoryItemData>;
  onAdd?: () => void;
}>;

export function CategoryPanel({
  locale,
  title,
  addLabel,
  categories,
  onAdd,
}: CategoryPanelProps) {
  const titleId = useId();

  return (
    <aside
      aria-labelledby={titleId}
      className="min-w-0 rounded-[20px] border border-[#49404f] bg-[#26222d] p-[17px]"
    >
      <div className="mb-[15px] flex items-center justify-between gap-[10px]">
        <h2 id={titleId} className="font-medium">
          {title}
        </h2>
        <button
          type="button"
          onClick={onAdd}
          className="cursor-pointer rounded-[10px] border border-[#49404f] bg-[#302a37] px-[9px] py-[7px] text-[#f7f2fa] outline-offset-2 focus-visible:outline-2 focus-visible:outline-[#86afe0]"
        >
          <span aria-hidden="true">+ </span>
          {addLabel}
        </button>
      </div>
      <ul className="grid list-none gap-2 p-0">
        {categories.map((category) => (
          <CategoryItem key={category.id} category={category} locale={locale} />
        ))}
      </ul>
    </aside>
  );
}
