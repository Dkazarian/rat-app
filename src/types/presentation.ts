import type { Locale } from "@/i18n";

export const categoryColorTokens = [
  "coral",
  "purple",
  "teal",
  "yellow",
  "blue",
  "muted",
] as const;

export type CategoryColorToken = (typeof categoryColorTokens)[number];

export const dashboardStates = [
  "empty",
  "loading",
  "success",
  "extraction-failure",
  "provider-error",
] as const;

export type DashboardState = (typeof dashboardStates)[number];

export type AnnouncementMode = "polite" | "assertive";

export type CategoryItemData = Readonly<{
  id: string;
  name: string;
  color: CategoryColorToken;
  totalMinor: number;
}>;

export type ExpenseItemData = Readonly<{
  id: string;
  description: string;
  categoryId: string;
  categoryName: string;
  color: CategoryColorToken;
  amountMinor: number;
}>;

export type SpendingCategoryPercentItemData = Readonly<{
  categoryId: string;
  name: string;
  color: CategoryColorToken;
  percent: number;
}>;

export type RatDialogueData = Readonly<{
  state: DashboardState;
  announcement: AnnouncementMode;
  mascotSrc: string;
}>;

export type LanguageControlProps = Readonly<{
  label: string;
  locale: Locale;
  englishLabel: string;
  spanishLabel: string;
  onLocaleChange?: (locale: Locale) => void;
}>;

export type ExpenseInputProps = Readonly<{
  label: string;
  placeholder: string;
  actionLabel: string;
  value: string;
  disabled?: boolean;
  validationMessage?: string;
  onValueChange?: (value: string) => void;
  onSubmit?: () => void;
}>;

export type RatDialogueProps = RatDialogueData &
  Readonly<{
    title: string;
    detail: string;
    mascotAlt: string;
  }>;

export type CategoryPanelProps = Readonly<{
  locale: Locale;
  title: string;
  addLabel: string;
  categories: ReadonlyArray<CategoryItemData>;
  onAdd?: () => void;
}>;

export type SpendingSummaryProps = Readonly<{
  locale: Locale;
  title: string;
  periodLabel: string;
  totalLabel: string;
  totalMinor: number;
  chartLabel: string;
  items: ReadonlyArray<SpendingCategoryPercentItemData>;
}>;

export type ExpenseListProps = Readonly<{
  locale: Locale;
  title: string;
  periodLabel: string;
  expenses: ReadonlyArray<ExpenseItemData>;
}>;

export type DashboardFixture = Readonly<{
  id: DashboardState;
  locale: Locale;
  inputValue: string;
  feedback: RatDialogueData;
  categories: ReadonlyArray<CategoryItemData>;
  spending: Readonly<{
    totalMinor: number;
    items: ReadonlyArray<SpendingCategoryPercentItemData>;
  }>;
  expenses: ReadonlyArray<ExpenseItemData>;
}>;
