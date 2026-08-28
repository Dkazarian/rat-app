import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ExpenseInput as ExpenseInputComponent } from "@/components/capture-panel/expense-input";
import { Mascot as MascotComponent } from "@/components/capture-panel/mascot";
import { RatDialogue as RatDialogueComponent } from "@/components/capture-panel/rat-dialogue";
import { CategoryItem as CategoryItemComponent } from "@/components/category-panel/category-item";
import { AppShell as AppShellComponent } from "@/components/dashboard-page/app-shell";
import { DashboardLayout as DashboardLayoutComponent } from "@/components/dashboard-page/dashboard-layout";
import { Footer as FooterComponent } from "@/components/dashboard-page/footer";
import { ResultsPanel as ResultsPanelComponent } from "@/components/dashboard-page/results-panel";
import { ExpenseItem as ExpenseItemComponent } from "@/components/expense-list/expense-item";
import { LanguageControl as LanguageControlComponent } from "@/components/header/language-control";
import { SpendingCategoryPercentItem as SpendingCategoryPercentItemComponent } from "@/components/spending-summary/spending-category-percent-item";
import { SpendingChart as SpendingChartComponent } from "@/components/spending-summary/spending-chart";
import { dashboardFixtures } from "@/fixtures/dashboard-fixtures";

const success = dashboardFixtures.success;

const meta = {
  title: "Components/Primitives",
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <main className="min-h-screen min-w-[360px] bg-[#18161e] p-6 text-sm text-[#f7f2fa]">
        <Story />
      </main>
    ),
  ],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const AppShell: Story = {
  render: () => (
    <AppShellComponent label="Ratapp shell">Shell content</AppShellComponent>
  ),
};

export const LanguageControl: Story = {
  render: () => (
    <LanguageControlComponent
      label="Language"
      locale="en"
      englishLabel="English"
      spanishLabel="Español"
    />
  ),
};

export const Mascot: Story = {
  render: () => (
    <MascotComponent src="/assets/rat-mascot.png" alt="Happy rat mascot" />
  ),
};

export const AwaitingMascot: Story = {
  render: () => (
    <MascotComponent
      src="/assets/rat-mascot-awaiting.png"
      alt="Rat mascot waiting for expense input"
    />
  ),
};

export const RatDialogue: Story = {
  render: () => (
    <RatDialogueComponent
      state="success"
      announcement="polite"
      title="Done"
      detail="3 expenses sorted."
    />
  ),
};

export const ExpenseInput: Story = {
  render: () => (
    <ExpenseInputComponent
      label="What did you spend?"
      placeholder="Lunch $18"
      actionLabel="Sort it"
      value="Lunch $18"
    />
  ),
};

export const CategoryItem: Story = {
  render: () => (
    <ul className="w-64 list-none p-0">
      <CategoryItemComponent category={success.categories[0]} locale="en" />
    </ul>
  ),
};

export const DashboardLayout: Story = {
  render: () => (
    <div className="w-[700px] max-w-full">
      <DashboardLayoutComponent
        categoryPanel={<div className="rounded-xl border p-4">Categories</div>}
        resultsPanel={<div className="rounded-xl border p-4">Results</div>}
      />
    </div>
  ),
};

export const ResultsPanel: Story = {
  render: () => (
    <ResultsPanelComponent
      spendingSummary={<div>Spending summary</div>}
      expenseList={<div>Expense list</div>}
    />
  ),
};

export const SpendingChart: Story = {
  render: () => (
    <SpendingChartComponent
      label="Spending by category"
      totalLabel="total"
      totalMinor={success.spending.totalMinor}
      locale="en"
      items={success.spending.items}
    />
  ),
};

export const SpendingCategoryPercentItem: Story = {
  render: () => (
    <ul className="w-64 list-none p-0">
      <SpendingCategoryPercentItemComponent item={success.spending.items[0]} />
    </ul>
  ),
};

export const ExpenseItem: Story = {
  render: () => (
    <ul className="w-64 list-none p-0">
      <ExpenseItemComponent expense={success.expenses[0]} locale="en" />
    </ul>
  ),
};

export const Footer: Story = {
  render: () => (
    <FooterComponent
      poweredByLabel="Powered by"
      model="fixture/model"
      sourceLabel="View source"
      sourceAriaLabel="Open source in a new tab"
      sourceHref="https://github.com/Dkazarian/rat-app"
    />
  ),
};
