import type { Locale } from "@/i18n";
import type { CategoryColorToken } from "@/features/categories/types";
import { categoryColorValues } from "@/utils/category-color";
import { formatAmount } from "@/utils/format-amount";

export type CategoryItemData = Readonly<{
  id: string;
  name: string;
  color: CategoryColorToken;
  totalMinor: number;
}>;

export type CategoryItemProps = Readonly<{
  category: CategoryItemData;
  locale: Locale;
}>;

export function CategoryItem({ category, locale }: CategoryItemProps) {
  return (
    <li className="grid grid-cols-[12px_minmax(0,1fr)_auto] items-center gap-[9px] border-b border-[#49404f] py-[10px] last:border-b-0">
      <span
        aria-hidden="true"
        className="size-[10px] rounded-full"
        style={{ backgroundColor: categoryColorValues[category.color] }}
      />
      <span className="min-w-0">{category.name}</span>
      <span className="font-medium whitespace-nowrap tabular-nums">
        {formatAmount(category.totalMinor, locale)}
      </span>
    </li>
  );
}
