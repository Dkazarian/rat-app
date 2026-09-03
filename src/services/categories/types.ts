export const categoryColorTokens = [
  "coral",
  "purple",
  "teal",
  "yellow",
  "blue",
] as const;

export type CategoryColorToken = (typeof categoryColorTokens)[number] | "muted";

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

export type CategoryCreationResult = Readonly<{
  ok: true;
  category: CustomCategory;
  categories: ReadonlyArray<Category>;
}>;
export type CategoryDeletionResult = Readonly<{
  ok: true;
  deletedCategory: Category;
  categories: ReadonlyArray<Category>;
}>;
