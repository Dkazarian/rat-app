import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { useCallback, useRef } from "react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { getLocale } from "@/i18n";

import { mapCategoriesToItems } from "../category-display";
import { createCategory, createInitialCategories } from "../category-rules";
import type { Category } from "../types";
import { useCategories } from "../use-categories";

import { CategoryPanel } from "./category-panel";

function createStoryCategories(customNames: ReadonlyArray<string>) {
  let categories: ReadonlyArray<Category> = createInitialCategories();

  customNames.forEach((name, index) => {
    const result = createCategory(categories, {
      id: `story-category-${index + 1}`,
      name,
    });

    if (result.ok) categories = result.categories;
  });

  return categories;
}

function StoryFrame({ children }: Readonly<{ children: ReactNode }>) {
  return <div className="w-[340px] max-w-full text-[#f7f2fa]">{children}</div>;
}

function InteractiveCategoryPanelStory() {
  const { i18n, t } = useTranslation();
  const nextId = useRef(1);
  const createId = useCallback(() => `story-created-${nextId.current++}`, []);
  const session = useCategories(createId);

  return (
    <StoryFrame>
      <CategoryPanel
        locale={getLocale(i18n.resolvedLanguage ?? i18n.language)}
        categories={mapCategoriesToItems(session.categories, t)}
        onCreateCategory={session.createCategory}
        onDeleteCategory={(categoryId) => {
          session.deleteCategory(categoryId);
        }}
      />
    </StoryFrame>
  );
}

function FixedCategoryPanelStory({
  categories,
}: Readonly<{ categories: ReadonlyArray<Category> }>) {
  const { i18n, t } = useTranslation();

  return (
    <StoryFrame>
      <CategoryPanel
        locale={getLocale(i18n.resolvedLanguage ?? i18n.language)}
        categories={mapCategoriesToItems(categories, t)}
        onCreateCategory={(name) =>
          createCategory(categories, { id: "story-attempt", name })
        }
        onDeleteCategory={() => undefined}
      />
    </StoryFrame>
  );
}

const meta = {
  title: "Features/Categories/CategoryPanel",
  component: InteractiveCategoryPanelStory,
  parameters: { layout: "centered" },
} satisfies Meta<typeof InteractiveCategoryPanelStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const OpenCreationForm: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "New" }));
    await expect(
      canvas.getByRole("textbox", { name: "Category name" }),
    ).toHaveFocus();
  },
};

export const Validation: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "New" }));
    await userEvent.click(canvas.getByRole("button", { name: "Add" }));
    await expect(canvas.getByRole("alert")).toHaveTextContent(
      "Enter a category name.",
    );
  },
};

export const CategoryLimit: Story = {
  render: () => (
    <FixedCategoryPanelStory
      categories={createStoryCategories([
        "Health",
        "Travel",
        "Gifts",
        "Pets",
        "Education",
        "Savings",
      ])}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "New" }));
    await userEvent.type(
      canvas.getByRole("textbox", { name: "Category name" }),
      "Other",
    );
    await userEvent.click(canvas.getByRole("button", { name: "Add" }));
    await expect(canvas.getByRole("alert")).toHaveTextContent(
      "You can have up to 10 categories.",
    );
  },
};

export const RepresentativeEnglish: Story = {
  render: () => (
    <FixedCategoryPanelStory categories={createStoryCategories(["Health"])} />
  ),
};

export const RepresentativeSpanish: Story = {
  globals: { locale: "es" },
  render: () => (
    <FixedCategoryPanelStory categories={createStoryCategories(["Health"])} />
  ),
};
