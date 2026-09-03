import type { CategorySpendingItemData } from "@/features/expenses/view-types";
import { categoryColorValues } from "@/features/categories/category-color";

export type CategorySpendingItemProps = Readonly<{
  item: CategorySpendingItemData;
}>;

export function CategorySpendingItem({ item }: CategorySpendingItemProps) {
  return (
    <li className="grid grid-cols-[10px_minmax(0,1fr)] items-center gap-2">
      <span
        aria-hidden="true"
        className="size-[10px] rounded-full"
        style={{ backgroundColor: categoryColorValues[item.color] }}
      />
      <span className="flex justify-between gap-2">
        <span>{item.name}</span>
        <strong className="font-medium tabular-nums">{item.percent}%</strong>
      </span>
    </li>
  );
}
