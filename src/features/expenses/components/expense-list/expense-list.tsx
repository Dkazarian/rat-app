"use client";

import { useId } from "react";
import { ExpenseListItem } from "./expense-list-item";
import type { ExpenseListItemData } from "@/features/expenses/view-types";
import { useLocale } from "@/i18n/locale-context";

export type ExpenseListProps = Readonly<{
  expenses: ReadonlyArray<ExpenseListItemData>;
  onDeleteExpense: (expenseId: string) => Promise<void>;
  disabled?: boolean;
}>;

export function ExpenseList({
  expenses,
  onDeleteExpense,
  disabled = false,
}: ExpenseListProps) {
  const titleId = useId();
  const { t } = useLocale();

  return (
    <section
      aria-labelledby={titleId}
      className="flex h-full min-h-0 flex-col max-[851px]:h-auto"
    >
      <div className="mb-[15px] flex shrink-0 items-center justify-between gap-[10px]">
        <h2 id={titleId} className="font-medium">
          {t("recentExpenses")}
        </h2>
        <span className="text-[#bbb1c1]">{t("today")}</span>
      </div>
      {expenses.length === 0 ? (
        <p className="shrink-0 text-[#bbb1c1]">{t("noExpenses")}</p>
      ) : null}
      <ul className="-mx-1 grid min-h-0 flex-1 list-none gap-2 overflow-y-auto px-1 py-0 max-[851px]:flex-none max-[851px]:overflow-visible">
        {expenses.map((expense) => (
          <ExpenseListItem
            key={expense.id}
            expense={expense}
            onDeleteExpense={onDeleteExpense}
            disabled={disabled}
          />
        ))}
      </ul>
    </section>
  );
}
