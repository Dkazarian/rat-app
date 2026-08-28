import type { SpendingCategoryPercentItemData } from "@/types/presentation";
import { categoryColorValues } from "@/utils/category-color";

export type SpendingCategoryPercentItemProps = Readonly<{
  item: SpendingCategoryPercentItemData;
}>;

export function SpendingCategoryPercentItem({
  item,
}: SpendingCategoryPercentItemProps) {
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
