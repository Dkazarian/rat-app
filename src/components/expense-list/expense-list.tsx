import { useId } from "react";

import { ExpenseListItem } from "./expense-list-item";
import type {
  ExpenseCategoryOption,
  ExpenseListItemData,
} from "./expense-list-item";
import type { CategoryId } from "@/features/categories/types";
import type { ExpenseId } from "@/features/expenses/types";
import type { Locale } from "@/i18n";

export type ExpenseListProps = Readonly<{
  locale: Locale;
  title: string;
  periodLabel: string;
  expenses: ReadonlyArray<ExpenseListItemData>;
  categoryOptions: ReadonlyArray<ExpenseCategoryOption>;
  emptyMessage: string;
  getCategorySelectLabel: (expense: ExpenseListItemData) => string;
  getDeleteLabel: (expense: ExpenseListItemData) => string;
  onCategoryChange: (expenseId: ExpenseId, categoryId: CategoryId) => void;
  onDeleteExpense: (expenseId: ExpenseId) => void;
}>;

export function ExpenseList({
  locale,
  title,
  periodLabel,
  expenses,
  categoryOptions,
  emptyMessage,
  getCategorySelectLabel,
  getDeleteLabel,
  onCategoryChange,
  onDeleteExpense,
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
            locale={locale}
            categoryOptions={categoryOptions}
            categorySelectLabel={getCategorySelectLabel(expense)}
            deleteLabel={getDeleteLabel(expense)}
            onCategoryChange={onCategoryChange}
            onDelete={onDeleteExpense}
          />
        ))}
      </ul>
    </section>
  );
}
