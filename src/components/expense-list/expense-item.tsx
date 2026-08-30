import type { Locale } from "@/i18n";
import type { CategoryColorToken } from "@/features/categories/types";
import { categoryColorValues } from "@/utils/category-color";
import { formatAmount } from "@/utils/format-amount";

export type ExpenseItemData = Readonly<{
  id: string;
  description: string;
  categoryId: string;
  categoryName: string;
  color: CategoryColorToken;
  amountMinor: number;
}>;

export type ExpenseItemProps = Readonly<{
  expense: ExpenseItemData;
  locale: Locale;
}>;

export function ExpenseItem({ expense, locale }: ExpenseItemProps) {
  return (
    <li className="grid grid-cols-[12px_minmax(0,1fr)_auto] items-center gap-[10px] border-b border-[#49404f] py-[11px] last:border-b-0">
      <span
        aria-hidden="true"
        className="size-[10px] rounded-full"
        style={{ backgroundColor: categoryColorValues[expense.color] }}
      />
      <span className="min-w-0">
        <span className="block">{expense.description}</span>
        <span className="mt-0.5 block text-[#bbb1c1]">
          {expense.categoryName}
        </span>
      </span>
      <span className="font-medium whitespace-nowrap tabular-nums">
        {formatAmount(expense.amountMinor, locale)}
      </span>
    </li>
  );
}
