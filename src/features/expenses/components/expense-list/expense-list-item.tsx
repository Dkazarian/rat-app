"use client";

import type {
  ExpenseListItemData,
  ExpenseCategoryOption,
} from "@/features/expenses/view-types";
import { categoryColorValues } from "@/features/categories/category-color";
import { formatAmount } from "@/utils/format-amount";

export type ExpenseListItemProps = Readonly<{
  expense: ExpenseListItemData;
  categoryOptions: ReadonlyArray<ExpenseCategoryOption>;
  categorySelectLabel: string;
  deleteLabel: string;
  disabled?: boolean;
  onCategoryChange: (expenseId: string, categoryId: string | null) => void;
  onDelete: (expenseId: string) => void;
}>;

export function ExpenseListItem({
  expense,
  categoryOptions,
  categorySelectLabel,
  deleteLabel,
  onCategoryChange,
  onDelete,
  disabled = false,
}: ExpenseListItemProps) {
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
      <div className="col-start-2 col-span-2 flex w-full min-w-0 items-center gap-2 max-[520px]:col-start-1 max-[520px]:col-end-3">
        <select
          aria-label={categorySelectLabel}
          value={expense.categoryId ?? ""}
          disabled={disabled}
          onChange={(event) =>
            onCategoryChange(
              expense.id,
              event.target.value === "" ? null : event.target.value,
            )
          }
          className="min-h-9 min-w-0 flex-1 cursor-pointer rounded-lg border border-[#49404f] bg-[#302a37] px-2 text-[#f7f2fa] outline-offset-2 focus-visible:outline-2 focus-visible:outline-[#86afe0]"
        >
          {categoryOptions.map((category) => (
            <option key={JSON.stringify(category.id)} value={category.id ?? ""}>
              {category.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          aria-label={deleteLabel}
          onClick={() => onDelete(expense.id)}
          disabled={disabled}
          className="min-h-9 shrink-0 cursor-pointer rounded-lg border border-[#49404f] bg-[#302a37] px-3 text-[#bbb1c1] outline-offset-2 hover:text-[#f7f2fa] focus-visible:outline-2 focus-visible:outline-[#86afe0]"
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>
    </li>
  );
}
