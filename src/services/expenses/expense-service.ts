import {
  UNCLASSIFIED_CATEGORY_ID,
  categoryService,
  type CategoryService,
} from "@/services/categories/category-service";
import type { CategoryId } from "@/services/categories/types";
import type { UserId } from "@/services/users/types";
import { ExpenseNotFoundError, ExpenseValidationError } from "./expense-errors";
import type {
  Expense,
  ExpenseBatchAdditionResult,
  ExpenseBatchError,
  ExpenseCandidate,
  ExpenseId,
  ExpenseReclassificationResult,
} from "./types";
import { createBrowserId } from "@/utils/create-browser-id";

export class ExpenseService {
  private readonly expensesByUser = new Map<UserId, Expense[]>();
  private readonly categories: CategoryService;

  constructor(
    options: {
      categories?: CategoryService;
    } = {},
  ) {
    this.categories = options.categories ?? categoryService;
  }

  totalExpensesInCategoryForUser(
    userId: UserId,
    categoryId: CategoryId,
  ): number {
    return this._listExpensesInCategoryForUser(userId, categoryId).reduce(
      (total, expense) => total + expense.amountMinor,
      0,
    );
  }

  private _listExpensesInCategoryForUser(
    userId: UserId,
    categoryId: CategoryId,
  ): ReadonlyArray<Expense> {
    return this.listExpensesForUser(userId).filter(
      (expense) => expense.categoryId === categoryId,
    );
  }

  listExpensesForUser = (
    userId: UserId,
    sorted: boolean = false,
  ): ReadonlyArray<Expense> => {
    const expenses = [...(this.expensesByUser.get(userId) ?? [])];
    if (sorted) {
      expenses.sort((a, b) => b.id.localeCompare(a.id));
    }
    return expenses;
  };

  private _expensesForUser(userId: UserId): Expense[] {
    let expenses = this.expensesByUser.get(userId);
    if (!expenses) {
      expenses = [];
      this.expensesByUser.set(userId, expenses);
    }
    return expenses;
  }

  addExpenseBatch(
    candidates: ReadonlyArray<ExpenseCandidate>,
    userId: UserId,
  ): ExpenseBatchAdditionResult {
    const added: Expense[] = [];
    const errors: ExpenseBatchError[] = [];
    for (const candidate of candidates) {
      try {
        const expense = this.createExpense(candidate, userId);
        added.push(expense);
      } catch (error) {
        if (error instanceof ExpenseValidationError) {
          errors.push({ candidate, error });
        } else {
          throw error;
        }
      }
    }
    return { added, errors };
  }

  createExpense(ExpenseCandidate: ExpenseCandidate, userId: UserId): Expense {
    const { description, amountMinor, categoryId } = ExpenseCandidate;
    const expenses = this._expensesForUser(userId);
    if (description.trim().length === 0) {
      throw new ExpenseValidationError("invalid-description");
    }
    if (!Number.isSafeInteger(amountMinor) || amountMinor <= 0) {
      throw new ExpenseValidationError("invalid-amount");
    }
    const expense: Expense = {
      id: createBrowserId(),
      description,
      amountMinor,
      categoryId:
        categoryId !== undefined && this.categories.exists(userId, categoryId)
          ? categoryId
          : UNCLASSIFIED_CATEGORY_ID,
    };
    expenses.push(expense);
    return expense;
  }

  reclassifyExpense(
    expenseId: ExpenseId,
    categoryId: CategoryId,
    userId: UserId,
  ): ExpenseReclassificationResult {
    const expenses = this._expensesForUser(userId);
    const index = expenses.findIndex((expense) => expense.id === expenseId);
    const expense = expenses[index];
    if (!expense) throw new ExpenseNotFoundError(expenseId);
    const reclassifiedExpense: Expense = { ...expense, categoryId };
    expenses[index] = reclassifiedExpense;
    return reclassifiedExpense;
  }

  deleteExpense(expenseId: ExpenseId, userId: UserId): void {
    const expenses = this._expensesForUser(userId);
    const index = expenses.findIndex((expense) => expense.id === expenseId);
    if (index === -1) throw new ExpenseNotFoundError(expenseId);
    expenses.splice(index, 1);
  }

  removeCategoryFromExpensesInCategory(
    categoryId: CategoryId,
    userId: UserId,
  ): ReadonlyArray<Expense> {
    const reclassified: Expense[] = [];
    if (categoryId === UNCLASSIFIED_CATEGORY_ID) return reclassified;
    const expenses = this._expensesForUser(userId);
    for (const [index, expense] of expenses.entries()) {
      if (expense.categoryId === categoryId) {
        const reclassifiedExpense: Expense = {
          ...expense,
          categoryId: UNCLASSIFIED_CATEGORY_ID,
        };
        expenses[index] = reclassifiedExpense;
        reclassified.push(reclassifiedExpense);
      }
    }
    return reclassified;
  }
}

export const expenseService = new ExpenseService();
