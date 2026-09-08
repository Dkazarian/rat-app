import type { ExpenseListItemData } from "@/features/expenses/view-types";
import { categoryColorValues } from "@/features/categories/category-color";
import { formatAmount } from "@/utils/format-amount";
import { useLocale } from "@/i18n/locale-context";

export type ExpenseListItemProps = Readonly<{
  expense: ExpenseListItemData;
  onDeleteExpense: (expenseId: string) => Promise<void>;
  disabled?: boolean;
}>;

export function ExpenseListItem({
  expense,
  onDeleteExpense,
  disabled = false,
}: ExpenseListItemProps) {
  const { t } = useLocale();

  return (
    <li className="grid grid-cols-[12px_minmax(0,1fr)_auto_auto] items-center gap-x-[10px] gap-y-2 border-b border-[#49404f] py-[11px] last:border-b-0 max-[520px]:grid-cols-[12px_minmax(0,1fr)_auto]">
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
      <button
        type="button"
        disabled={disabled}
        aria-label={t("deleteExpense", { description: expense.description })}
        onClick={() => void onDeleteExpense(expense.id)}
        className="size-7 cursor-pointer rounded-lg border border-[#49404f] bg-[#302a37] text-[#bbb1c1] outline-offset-2 hover:text-[#f7f2fa] focus-visible:outline-2 focus-visible:outline-[#86afe0] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:text-[#bbb1c1] max-[520px]:col-start-3"
      >
        <span aria-hidden="true">×</span>
      </button>
    </li>
  );
}
