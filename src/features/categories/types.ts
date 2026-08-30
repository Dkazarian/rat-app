export const categoryColorTokens = [
  "coral",
  "purple",
  "teal",
  "yellow",
  "blue",
  "muted",
] as const;

export type CategoryColorToken = (typeof categoryColorTokens)[number];

export const nonMutedCategoryColorTokens = [
  "coral",
  "purple",
  "teal",
  "yellow",
  "blue",
] as const satisfies ReadonlyArray<CategoryColorToken>;

export const builtInCategoryIdentities = [
  "food",
  "home",
  "transport",
  "unclassified",
] as const;

export type BuiltInCategoryIdentity =
  (typeof builtInCategoryIdentities)[number];
export type BuiltInCategoryId = BuiltInCategoryIdentity;
export type CategoryId = string;
export type CustomCategoryName = string;

type CategoryBase = Readonly<{
  id: CategoryId;
  color: CategoryColorToken;
}>;

export type BuiltInCategory = {
  [Identity in BuiltInCategoryIdentity]: CategoryBase &
    Readonly<{
      id: Identity;
      kind: "built-in";
      identity: Identity;
      system: Identity extends "unclassified" ? true : false;
    }>;
}[BuiltInCategoryIdentity];

export type CustomCategory = CategoryBase &
  Readonly<{
    kind: "custom";
    name: CustomCategoryName;
    system: false;
  }>;

export type Category = BuiltInCategory | CustomCategory;

export const categoryNameValidationCodes = [
  "empty",
  "too-long",
  "duplicate",
  "reserved",
  "limit-reached",
] as const;

export type CategoryNameValidationCode =
  (typeof categoryNameValidationCodes)[number];

export type CategoryNameValidationResult =
  | Readonly<{ ok: true; name: CustomCategoryName }>
  | Readonly<{ ok: false; code: CategoryNameValidationCode }>;

export type CategoryCreationResult =
  | Readonly<{
      ok: true;
      category: CustomCategory;
      categories: ReadonlyArray<Category>;
    }>
  | Readonly<{
      ok: false;
      code: CategoryNameValidationCode;
      categories: ReadonlyArray<Category>;
    }>;

export const categoryDeletionRejectionCodes = [
  "not-found",
  "protected",
] as const;

export type CategoryDeletionRejectionCode =
  (typeof categoryDeletionRejectionCodes)[number];

export type CategoryDeletionResult =
  | Readonly<{
      ok: true;
      deletedCategory: Category;
      categories: ReadonlyArray<Category>;
    }>
  | Readonly<{
      ok: false;
      code: CategoryDeletionRejectionCode;
      categories: ReadonlyArray<Category>;
    }>;
