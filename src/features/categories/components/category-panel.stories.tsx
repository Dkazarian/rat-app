import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { useState } from "react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { mapCategoriesToItems } from "../category-display";
import { CategoryService } from "@/services/categories/category-service";
import type { Category } from "@/services/categories/types";
import { useCategories } from "@/features/categories/hooks/use-categories";

import { CategoryPanel } from "./category-panel";

function createStoryCategories(customNames: ReadonlyArray<string>) {
  let nextId = 1;
  const service = new CategoryService({
    createId: () => "story-category-" + nextId++,
  });
  customNames.forEach((name) => service.create(name));
  return service.list();
}

function StoryFrame({ children }: Readonly<{ children: ReactNode }>) {
  return <div className="w-[340px] max-w-full text-[#f7f2fa]">{children}</div>;
}

function InteractiveCategoryPanelStory() {
  const { t } = useTranslation();
  const [service] = useState(() => new CategoryService());
  const session = useCategories(service);

  return (
    <StoryFrame>
      <CategoryPanel
        categories={mapCategoriesToItems(session.categories, t)}
        onCreateCategory={session.createCategory}
        onDeleteCategory={session.deleteCategory}
      />
    </StoryFrame>
  );
}

function FixedCategoryPanelStory({
  categories,
}: Readonly<{ categories: ReadonlyArray<Category> }>) {
  const { t } = useTranslation();
  const [service] = useState(
    () => new CategoryService({ initialCategories: categories }),
  );
  const session = useCategories(service);

  return (
    <StoryFrame>
      <CategoryPanel
        categories={mapCategoriesToItems(session.categories, t)}
        onCreateCategory={session.createCategory}
        onDeleteCategory={session.deleteCategory}
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
        "Books",
        "Fitness",
        "Subscriptions",
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
