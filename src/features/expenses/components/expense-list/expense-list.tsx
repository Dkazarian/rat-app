"use client";

import { useId } from "react";
import { ExpenseListItem } from "./expense-list-item";
import type { ExpenseListItemData } from "@/features/expenses/view-types";
import { useLocale } from "@/i18n/locale-context";

export type ExpenseListProps = Readonly<{
  expenses: ReadonlyArray<ExpenseListItemData>;
}>;

export function ExpenseList({ expenses }: ExpenseListProps) {
  const titleId = useId();
  const { t } = useLocale();

  return (
    <section aria-labelledby={titleId}>
      <div className="mb-[15px] flex items-center justify-between gap-[10px]">
        <h2 id={titleId} className="font-medium">
          {t("recentExpenses")}
        </h2>
        <span className="text-[#bbb1c1]">{t("today")}</span>
      </div>
      {expenses.length === 0 ? (
        <p className="text-[#bbb1c1]">{t("noExpenses")}</p>
      ) : null}
      <ul className="grid list-none gap-2 p-0">
        {expenses.map((expense) => (
          <ExpenseListItem key={expense.id} expense={expense} />
        ))}
      </ul>
    </section>
  );
}
