import type {
  CategoryColorToken,
  CategoryId,
} from "@/services/categories/types";

export type CategoryItemData = Readonly<{
  id: CategoryId;
  name: string;
  color: CategoryColorToken;
  totalMinor: number;
  canDelete?: boolean;
}>;
