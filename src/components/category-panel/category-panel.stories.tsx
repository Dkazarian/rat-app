import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { getLocale } from "@/i18n";
import type { TranslationKey } from "@/i18n";
import { useTranslation } from "react-i18next";

import { dashboardFixtures } from "@/fixtures/dashboard-fixtures";

import { CategoryPanel } from "./category-panel";
import type { CategoryPanelProps } from "./category-panel";

const categoryKeys: Readonly<Record<string, TranslationKey>> = {
  food: "food",
  transport: "transport",
  home: "home",
  fun: "fun",
};

function LocalizedCategoryPanel(props: Pick<CategoryPanelProps, "categories">) {
  const { i18n, t } = useTranslation();
  const locale = getLocale(i18n.resolvedLanguage ?? i18n.language);
  const categories = props.categories.map((category) => ({
    ...category,
    name: t(categoryKeys[category.id] ?? "categories"),
  }));

  return (
    <CategoryPanel
      locale={locale}
      title={t("categories")}
      addLabel={t("newCategory")}
      categories={categories}
    />
  );
}

const meta = {
  title: "Components/CategoryPanel",
  component: LocalizedCategoryPanel,
  parameters: { layout: "centered" },
  args: {
    categories: dashboardFixtures.success.categories,
  },
} satisfies Meta<typeof LocalizedCategoryPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Populated: Story = {};
export const EmptyTotals: Story = {
  args: { categories: dashboardFixtures.empty.categories },
};
