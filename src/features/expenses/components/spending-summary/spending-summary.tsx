"use client";

import { CategorySpendingItem } from "./category-spending-item";
import type { CategorySpendingItemData } from "@/features/expenses/view-types";
import { SpendingChart } from "./spending-chart";
import { useLocale } from "@/i18n/locale-context";

export type SpendingSummaryProps = Readonly<{
  totalMinor: number;
  items: ReadonlyArray<CategorySpendingItemData>;
}>;

export function SpendingSummary({ totalMinor, items }: SpendingSummaryProps) {
  const { t } = useLocale();

  return (
    <section className="grid grid-cols-[190px_minmax(0,1fr)] items-center gap-[18px] max-[680px]:grid-cols-1 max-[680px]:gap-2">
      <SpendingChart totalMinor={totalMinor} items={items} />
      <div className="min-w-0">
        <div className="mb-[15px] flex items-center justify-between gap-[10px]">
          <h2 className="font-medium">{t("spending")}</h2>
          <span className="text-[#bbb1c1]">{t("thisMonth")}</span>
        </div>
        <ul className="grid list-none grid-cols-2 gap-x-4 gap-y-[10px] p-0 max-[680px]:grid-cols-1">
          {items.map((item) => (
            <CategorySpendingItem
              key={item.categoryId ?? "unclassified"}
              item={item}
            />
          ))}
        </ul>
      </div>
    </section>
  );
}
