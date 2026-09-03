import { CategoryService } from "@/services/categories/category-service";
import type {
  CategoryCreationResult,
  CategoryId,
} from "@/services/categories/types";
import { ExpenseService } from "@/services/expenses/expense-service";
import type {
  ExpenseBatchAdditionResult,
  ExpenseId,
} from "@/services/expenses/types";
import { createBrowserId } from "@/utils/create-browser-id";
import type {
  CapturedExpenseCandidate,
  SessionCategoryDeletionResult,
  SessionServiceOptions,
} from "./types";

/** Owns one session's business workflows, independently of its React view. */
export class SessionService {
  private readonly categories: CategoryService;
  private readonly expenses: ExpenseService;
  private readonly createExpenseId: () => ExpenseId;

  constructor(options: SessionServiceOptions = {}) {
    this.categories = new CategoryService({
      initialCategories: options.initialCategories,
      createId: options.createCategoryId,
    });
    this.expenses = new ExpenseService({
      initialExpenses: options.initialExpenses,
      categories: this.categories,
    });
    this.createExpenseId = options.createExpenseId ?? createBrowserId;
  }

  listCategories() {
    return this.categories.list();
  }

  listExpenses() {
    return this.expenses.list();
  }

  createCategory(name: string): CategoryCreationResult {
    const category = this.categories.create(name);
    return { ok: true, category, categories: this.categories.list() };
  }

  deleteCategory(categoryId: CategoryId): SessionCategoryDeletionResult {
    // Validate before either collection changes. All subsequent work is synchronous.
    this.categories.assertCanDelete(categoryId);
    const reassignedExpenses =
      this.expenses.reassignExpensesFromCategory(categoryId);
    const deletedCategory = this.categories.delete(categoryId);
    return {
      ok: true,
      deletedCategory,
      categories: this.categories.list(),
      reassignedExpenses,
    };
  }

  captureExpenses(
    candidates: ReadonlyArray<CapturedExpenseCandidate>,
  ): ExpenseBatchAdditionResult {
    return this.expenses.addExpenseBatch(
      candidates.map((candidate) => ({
        ...candidate,
        id: candidate.id ?? this.createExpenseId(),
      })),
    );
  }

  reclassifyExpense(expenseId: ExpenseId, categoryId: CategoryId) {
    return this.expenses.reclassifyExpense(expenseId, categoryId);
  }

  deleteExpense(expenseId: ExpenseId): void {
    this.expenses.deleteExpense(expenseId);
  }

  reassignExpensesFromCategory(categoryId: CategoryId) {
    return this.expenses.reassignExpensesFromCategory(categoryId);
  }
}
