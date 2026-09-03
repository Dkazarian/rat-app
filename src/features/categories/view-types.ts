import type { CategoryColorToken } from "@/features/categories/category-color";

export type CategoryItemData = Readonly<{
  id: string | null;
  name: string;
  color: CategoryColorToken;
  totalMinor: number;
  canDelete?: boolean;
}>;
