import { useId } from "react";

import { ExpenseItem } from "./expense-item";
import type { ExpenseItemData } from "./expense-item";
import type { Locale } from "@/i18n";

export type ExpenseListProps = Readonly<{
  locale: Locale;
  title: string;
  periodLabel: string;
  expenses: ReadonlyArray<ExpenseItemData>;
}>;

export function ExpenseList({
  locale,
  title,
  periodLabel,
  expenses,
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
      <ul className="grid list-none gap-2 p-0">
        {expenses.map((expense) => (
          <ExpenseItem key={expense.id} expense={expense} locale={locale} />
        ))}
      </ul>
    </section>
  );
}
