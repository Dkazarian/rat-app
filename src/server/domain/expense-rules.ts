import type { ExpenseDto, ExpensesResponse } from "@/contracts/session-api";
import { applicationErrors } from "./errors";

export type StoredExpense = ExpenseDto;

export type ExpenseCandidate = Readonly<{
  description: string;
  amountMinor: number;
  categoryId: string | null;
}>;

export function validateExpenseCandidate(
  candidate: ExpenseCandidate,
  categoryIds: ReadonlySet<string>,
): ExpenseCandidate {
  const description = candidate.description.trim();
  if (
    !description ||
    !Number.isSafeInteger(candidate.amountMinor) ||
    candidate.amountMinor <= 0
  ) {
    throw applicationErrors.invalidRequest();
  }
  return {
    description,
    amountMinor: candidate.amountMinor,
    categoryId:
      candidate.categoryId !== null && categoryIds.has(candidate.categoryId)
        ? candidate.categoryId
        : null,
  };
}

export function toExpensesResponse(
  storedExpenses: ReadonlyArray<StoredExpense>,
  categoryIds: ReadonlySet<string>,
): ExpensesResponse {
  return {
    expenses: storedExpenses
      .map((expense) => ({
        ...expense,
        categoryId:
          expense.categoryId !== null && categoryIds.has(expense.categoryId)
            ? expense.categoryId
            : null,
      }))
      .sort(
        (left, right) =>
          right.createdAt - left.createdAt || left.id.localeCompare(right.id),
      ),
  };
}
