import {
  UNCLASSIFIED_CATEGORY_ID,
  categoryService,
  type CategoryService,
} from "@/features/categories/category-service";
import type { CategoryId } from "@/features/categories/types";
import { ExpenseNotFoundError, ExpenseValidationError } from "./expense-errors";
import type {
  Expense,
  ExpenseBatchAdditionResult,
  ExpenseBatchError,
  ExpenseCandidate,
  ExpenseId,
  ExpenseReclassificationResult,
} from "./types";

export class ExpenseService {
  private readonly expenses: Map<ExpenseId, Expense>;
  private readonly categories: CategoryService;

  constructor(
    options: {
      initialExpenses?: ReadonlyArray<Expense>;
      categories?: CategoryService;
    } = {},
  ) {
    this.expenses = new Map(
      (options.initialExpenses ?? []).map((expense) => [expense.id, expense]),
    );
    this.categories = options.categories ?? categoryService;
    this.categories.setExpenseService(this);
  }

  list(): ReadonlyArray<Expense> {
    return [...this.expenses.values()];
  }

  hasExpensesForCategory(categoryId: CategoryId): boolean {
    return this.list().some((expense) => expense.categoryId === categoryId);
  }

  addExpenseBatch(
    candidates: ReadonlyArray<ExpenseCandidate>,
  ): ExpenseBatchAdditionResult {
    const added: Expense[] = [];
    const errors: ExpenseBatchError[] = [];
    const categoryIds = new Set(this.categories.list().map(({ id }) => id));
    for (const candidate of candidates) {
      const { id, description, amountMinor, categoryId } = candidate;
      const code =
        description.trim().length === 0
          ? "invalid-description"
          : !Number.isSafeInteger(amountMinor) || amountMinor <= 0
            ? "invalid-amount"
            : this.expenses.has(id)
              ? "duplicate-id"
              : undefined;
      if (code) {
        errors.push({ candidate, error: new ExpenseValidationError(code) });
        continue;
      }
      const expense: Expense = {
        id,
        description,
        amountMinor,
        categoryId:
          categoryId && categoryIds.has(categoryId)
            ? categoryId
            : UNCLASSIFIED_CATEGORY_ID,
      };
      this.expenses.set(id, expense);
      added.push(expense);
    }
    return { added, errors };
  }

  reclassifyExpense(
    expenseId: ExpenseId,
    categoryId: CategoryId,
  ): ExpenseReclassificationResult {
    const expense = this.expenses.get(expenseId);
    if (!expense) throw new ExpenseNotFoundError(expenseId);
    this.categories.find(categoryId);
    const reclassifiedExpense: Expense = { ...expense, categoryId };
    this.expenses.set(expenseId, reclassifiedExpense);
    return reclassifiedExpense;
  }

  deleteExpense(expenseId: ExpenseId): void {
    const deletedExpense = this.expenses.get(expenseId);
    if (!deletedExpense) throw new ExpenseNotFoundError(expenseId);
    this.expenses.delete(expenseId);
  }

  reassignExpensesFromCategory(categoryId: CategoryId): ReadonlyArray<Expense> {
    this.categories.find(categoryId);
    const reclassified: Expense[] = [];
    if (categoryId === UNCLASSIFIED_CATEGORY_ID) return reclassified;
    for (const [id, expense] of this.expenses) {
      if (expense.categoryId === categoryId) {
        const reclassifiedExpense: Expense = {
          ...expense,
          categoryId: UNCLASSIFIED_CATEGORY_ID,
        };
        this.expenses.set(id, reclassifiedExpense);
        reclassified.push(reclassifiedExpense);
      }
    }
    return reclassified;
  }
}

export const expenseService = new ExpenseService();
