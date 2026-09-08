import {
  EXPENSE_DESCRIPTION_MAX_LENGTH,
  type ExpenseDto,
  type ExpensesResponse,
} from "@/contracts/session-api";
import { applicationErrors } from "./errors";

export type StoredExpense = ExpenseDto;

export type ExpenseCandidate = Readonly<{
  description: string;
  amountMinor: number;
  categoryId: string | null;
}>;

function capitalizeFirstLetter(value: string): string {
  const firstLetter = value.match(/\p{L}/u);
  if (!firstLetter || firstLetter.index === undefined) return value;
  const start = firstLetter.index;
  const end = start + firstLetter[0].length;
  return `${value.slice(0, start)}${firstLetter[0].toUpperCase()}${value.slice(end)}`;
}

export function validateExpenseCandidate(
  candidate: ExpenseCandidate,
  categoryIds: ReadonlySet<string>,
): ExpenseCandidate {
  const description = capitalizeFirstLetter(candidate.description.trim());
  if (
    !description ||
    description.length > EXPENSE_DESCRIPTION_MAX_LENGTH ||
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
