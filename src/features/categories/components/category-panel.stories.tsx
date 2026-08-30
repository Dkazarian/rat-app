import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useTranslation } from "react-i18next";

import { mapCategoriesToItems } from "../category-display";
import { createCategory, createInitialCategories } from "../category-rules";
import { getLocale } from "@/i18n";

import { CategoryPanel } from "./category-panel";
import { CategoryItem } from "./category-item";

function CategoryPanelStory() {
  const { i18n, t } = useTranslation();
  const locale = getLocale(i18n.resolvedLanguage ?? i18n.language);
  const categories = createInitialCategories();

  return (
    <div className="w-[320px] text-[#f7f2fa]">
      <CategoryPanel
        locale={locale}
        categories={mapCategoriesToItems(categories, t)}
        onCreateCategory={(name) =>
          createCategory(categories, { id: "story-category", name })
        }
        onDeleteCategory={() => undefined}
      />
    </div>
  );
}

const meta = {
  title: "Features/Categories/CategoryPanel",
  component: CategoryPanelStory,
  parameters: { layout: "centered" },
} satisfies Meta<typeof CategoryPanelStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Item: Story = {
  render: function CategoryItemStory() {
    const { i18n, t } = useTranslation();
    const name = t("food");

    return (
      <ul className="w-64 list-none text-[#f7f2fa]">
        <CategoryItem
          category={{
            id: "food",
            name,
            color: "coral",
            totalMinor: 0,
            canDelete: true,
          }}
          locale={getLocale(i18n.resolvedLanguage ?? i18n.language)}
          deleteLabel={t("deleteCategory", { name })}
        />
      </ul>
    );
  },
};
