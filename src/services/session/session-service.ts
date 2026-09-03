import { CategoryService } from "@/services/categories/category-service";
import { CategoryNotFoundError } from "@/services/categories/category-errors";
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
import type { UserId } from "@/services/users/types";
import type {
  CapturedExpenseCandidate,
  SessionCategoryDeletionResult,
  SessionServiceOptions,
} from "./types";

/** Owns one session's business workflows, independently of its React view. */
export class SessionService {
  readonly userId: UserId;
  private readonly categories: CategoryService;
  private readonly expenses: ExpenseService;

  constructor(options: SessionServiceOptions = {}) {
    this.userId = options.userId ?? createBrowserId();
    this.categories = new CategoryService();
    const seededCategoryIds = new Map<CategoryId, CategoryId>([[null, null]]);
    for (const category of options.initialCategories ?? []) {
      if (category.kind === "custom") {
        const created = this.categories.create(this.userId, category.name);
        seededCategoryIds.set(category.id, created.id);
      }
    }
    this.expenses = new ExpenseService({
      categories: this.categories,
    });
    this.expenses.addExpenseBatch(
      (options.initialExpenses ?? []).map((expense) => ({
        ...expense,
        categoryId: seededCategoryIds.get(expense.categoryId) ?? null,
      })),
      this.userId,
    );
  }

  listCategories() {
    return this.categories.listCategoriesForUser(this.userId);
  }

  listExpenses(sorted = false) {
    return this.expenses.listExpensesForUser(this.userId, sorted);
  }

  totalExpensesInCategory(categoryId: CategoryId) {
    return this.expenses.totalExpensesInCategoryForUser(
      this.userId,
      categoryId,
    );
  }

  listRecentExpenses(amount: number) {
    if (!Number.isSafeInteger(amount) || amount < 0) {
      throw new RangeError("The expense count must be a non-negative integer.");
    }
    return this.listExpenses(true).slice(0, amount);
  }

  createCategory(name: string): CategoryCreationResult {
    const category = this.categories.create(this.userId, name);
    return { ok: true, category, categories: this.listCategories() };
  }

  deleteCategory(categoryId: CategoryId): SessionCategoryDeletionResult {
    const deletedCategory = this.categories.findUserCategoryById(
      this.userId,
      categoryId,
    );
    if (!deletedCategory || deletedCategory.system) {
      return {
        ok: true,
        categories: this.listCategories(),
        reassignedExpenses: [],
      };
    }
    const reassignedExpenses =
      this.expenses.removeCategoryFromExpensesInCategory(
        categoryId,
        this.userId,
      );
    this.categories.delete(this.userId, categoryId);
    return {
      ok: true,
      deletedCategory,
      categories: this.listCategories(),
      reassignedExpenses,
    };
  }

  captureExpenses(
    candidates: ReadonlyArray<CapturedExpenseCandidate>,
  ): ExpenseBatchAdditionResult {
    return this.expenses.addExpenseBatch(candidates, this.userId);
  }

  reclassifyExpense(expenseId: ExpenseId, categoryId: CategoryId) {
    if (!this.categories.exists(this.userId, categoryId)) {
      throw new CategoryNotFoundError(categoryId);
    }
    return this.expenses.reclassifyExpense(expenseId, categoryId, this.userId);
  }

  deleteExpense(expenseId: ExpenseId): void {
    this.expenses.deleteExpense(expenseId, this.userId);
  }

  reassignExpensesFromCategory(categoryId: CategoryId) {
    return this.expenses.removeCategoryFromExpensesInCategory(
      categoryId,
      this.userId,
    );
  }
}
