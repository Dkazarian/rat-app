import { useId } from "react";

import { ExpenseListItem } from "./expense-list-item";
import type {
  ExpenseCategoryOption,
  ExpenseListItemData,
} from "@/features/expenses/view-types";

export type ExpenseListProps = Readonly<{
  title: string;
  periodLabel: string;
  expenses: ReadonlyArray<ExpenseListItemData>;
  categoryOptions: ReadonlyArray<ExpenseCategoryOption>;
  emptyMessage: string;
  getCategorySelectLabel: (expense: ExpenseListItemData) => string;
  getDeleteLabel: (expense: ExpenseListItemData) => string;
  disabled?: boolean;
  onCategoryChange: (expenseId: string, categoryId: string | null) => void;
  onDeleteExpense: (expenseId: string) => void;
}>;

export function ExpenseList({
  title,
  periodLabel,
  expenses,
  categoryOptions,
  emptyMessage,
  getCategorySelectLabel,
  getDeleteLabel,
  onCategoryChange,
  onDeleteExpense,
  disabled = false,
}: ExpenseListProps) {
  const titleId = useId();

  return (
    <section aria-labelledby={titleId}>
      <div className="mb-[15px] flex items-center justify-between gap-[10px]">
        <h2 id={titleId} className="font-medium">
          {title}
        </h2>
        <span className="text-[#bbb1c1]">{periodLabel}</span>
      </div>
      {expenses.length === 0 ? (
        <p className="text-[#bbb1c1]">{emptyMessage}</p>
      ) : null}
      <ul className="grid list-none gap-2 p-0">
        {expenses.map((expense) => (
          <ExpenseListItem
            key={expense.id}
            expense={expense}
            categoryOptions={categoryOptions}
            categorySelectLabel={getCategorySelectLabel(expense)}
            deleteLabel={getDeleteLabel(expense)}
            onCategoryChange={onCategoryChange}
            onDelete={onDeleteExpense}
            disabled={disabled}
          />
        ))}
      </ul>
    </section>
  );
}
