export const categoryColorTokens = [
  "coral",
  "purple",
  "teal",
  "yellow",
  "blue",
] as const;

export type CategoryColorToken = (typeof categoryColorTokens)[number] | "muted";

export type CategoryId = string | null;
export type CustomCategoryName = string;

type CategoryBase = Readonly<{
  id: CategoryId;
  color: CategoryColorToken;
}>;

export type UnclassifiedCategory = CategoryBase &
  Readonly<{
    id: null;
    kind: "built-in";
    system: true;
  }>;

export type CustomCategory = CategoryBase &
  Readonly<{
    id: string;
    kind: "custom";
    name: CustomCategoryName;
    system: false;
  }>;

export type Category = UnclassifiedCategory | CustomCategory;

export const categoryNameValidationCodes = [
  "empty",
  "too-long",
  "duplicate",
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
  deletedCategory?: Category;
  categories: ReadonlyArray<Category>;
}>;
