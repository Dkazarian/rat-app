import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import type { CategoryItemData } from "@/features/categories/view-types";
import { SessionApiError } from "@/features/dashboard/api/session-api-client";
import { CategoryPanel } from "./category-panel";

const initial: ReadonlyArray<CategoryItemData> = [
  {
    id: "10000000-0000-4000-8000-000000000001",
    name: "Food",
    color: "coral",
    totalMinor: 5183,
    canDelete: true,
  },
  {
    id: null,
    name: "Unclassified",
    color: "muted",
    totalMinor: 725,
    canDelete: false,
  },
];

function StoryPanel() {
  const [categories, setCategories] = useState(initial);
  return (
    <div className="w-[340px] max-w-full text-[#f7f2fa]">
      <CategoryPanel
        categories={categories}
        onCreateCategory={async (name) => {
          const trimmed = name.trim();
          if (!trimmed)
            throw new SessionApiError(
              "invalid_category_name",
              "Enter a category name.",
              "name",
            );
          setCategories((value) => [
            ...value.slice(0, -1),
            {
              id: crypto.randomUUID(),
              name: trimmed,
              color: "blue",
              totalMinor: 0,
              canDelete: true,
            },
            value.at(-1)!,
          ]);
        }}
        onDeleteCategory={async (id) =>
          setCategories((value) =>
            value.filter((category) => category.id !== id),
          )
        }
      />
    </div>
  );
}

const meta = {
  title: "Features/Categories/CategoryPanel",
  component: StoryPanel,
  parameters: { layout: "centered" },
} satisfies Meta<typeof StoryPanel>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Spanish: Story = { globals: { locale: "es" } };
