import type { CategoryColorToken } from "@/services/categories/types";

export const categoryColorValues = {
  coral: "#ff8b85",
  purple: "#a995e2",
  teal: "#72c7b6",
  yellow: "#efc76a",
  blue: "#86afe0",
  muted: "#bbb1c1",
} as const satisfies Record<CategoryColorToken, string>;
