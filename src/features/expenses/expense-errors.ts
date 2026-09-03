import type { ExpenseBatchRejectionCode, ExpenseId } from "./types";

export class ExpenseValidationError extends Error {
  constructor(public readonly code: ExpenseBatchRejectionCode) {
    super(`Invalid expense batch: ${code}`);
    this.name = "ExpenseValidationError";
  }
}

export class ExpenseNotFoundError extends Error {
  constructor(public readonly expenseId: ExpenseId) {
    super(`Expense not found: ${expenseId}`);
    this.name = "ExpenseNotFoundError";
  }
}
