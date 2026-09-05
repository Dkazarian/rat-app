import type { ExpenseListItemData } from "@/features/expenses/view-types";
import { categoryColorValues } from "@/features/categories/category-color";
import { formatAmount } from "@/utils/format-amount";

export type ExpenseListItemProps = Readonly<{
  expense: ExpenseListItemData;
}>;

export function ExpenseListItem({ expense }: ExpenseListItemProps) {
  return (
    <li className="grid grid-cols-[12px_minmax(0,1fr)_auto] items-center gap-x-[10px] gap-y-2 border-b border-[#49404f] py-[11px] last:border-b-0 max-[520px]:grid-cols-[12px_minmax(0,1fr)]">
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
      <span className="font-medium whitespace-nowrap tabular-nums max-[520px]:col-start-2">
        {formatAmount(expense.amountMinor)}
      </span>
    </li>
  );
}
