import type { CategoryId, CategoryNameValidationCode } from "./types";

export class CategoryValidationError extends Error {
  constructor(public readonly code: CategoryNameValidationCode) {
    super(`Invalid category name: ${code}`);
    this.name = "CategoryValidationError";
  }
}

export class CategoryNotFoundError extends Error {
  constructor(public readonly categoryId: CategoryId) {
    super(`Category not found: ${categoryId}`);
    this.name = "CategoryNotFoundError";
  }
}

export class ProtectedCategoryError extends Error {
  constructor(public readonly categoryId: CategoryId) {
    super(`Category cannot be deleted: ${categoryId}`);
    this.name = "ProtectedCategoryError";
  }
}

export class DuplicateCategoryIdError extends Error {
  constructor(public readonly categoryId: CategoryId) {
    super("Category ID already exists: " + categoryId);
    this.name = "DuplicateCategoryIdError";
  }
}
