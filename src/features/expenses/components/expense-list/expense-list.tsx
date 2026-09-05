import { useId } from "react";

import { ExpenseListItem } from "./expense-list-item";
import type { ExpenseListItemData } from "@/features/expenses/view-types";

export type ExpenseListProps = Readonly<{
  title: string;
  periodLabel: string;
  expenses: ReadonlyArray<ExpenseListItemData>;
  emptyMessage: string;
}>;

export function ExpenseList({
  title,
  periodLabel,
  expenses,
  emptyMessage,
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
          <ExpenseListItem key={expense.id} expense={expense} />
        ))}
      </ul>
    </section>
  );
}
