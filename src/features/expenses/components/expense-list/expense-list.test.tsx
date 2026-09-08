import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { I18nProvider } from "@/i18n/i18n-provider";
import { renderWithProviders } from "@/test/render";
import type { ExpenseListItemData } from "@/features/expenses/view-types";
import { ExpenseList } from "./expense-list";

const expense: ExpenseListItemData = {
  id: "20000000-0000-4000-8000-000000000001",
  description: "Lunch",
  amountMinor: 1800,
  categoryName: "Food",
  color: "coral",
};

function renderList(
  props: Partial<React.ComponentProps<typeof ExpenseList>> = {},
) {
  return renderWithProviders(
    <I18nProvider>
      <ExpenseList
        expenses={[expense]}
        onDeleteExpense={async () => undefined}
        {...props}
      />
    </I18nProvider>,
  );
}

describe("ExpenseList", () => {
  it("renders a localized delete control and passes the expense ID", async () => {
    const onDeleteExpense = vi.fn(async () => undefined);
    const { user } = renderList({ onDeleteExpense });

    await user.click(screen.getByRole("button", { name: "Delete Lunch" }));

    expect(onDeleteExpense).toHaveBeenCalledWith(expense.id);
  });

  it("disables deletion while a dashboard mutation is active", () => {
    renderList({ disabled: true });

    expect(screen.getByRole("button", { name: "Delete Lunch" })).toBeDisabled();
  });

  it("localizes the delete control in Spanish", () => {
    renderWithProviders(
      <I18nProvider initialLocale="es">
        <ExpenseList
          expenses={[expense]}
          onDeleteExpense={async () => undefined}
        />
      </I18nProvider>,
    );

    expect(
      screen.getByRole("button", { name: "Eliminar Lunch" }),
    ).toBeVisible();
  });

  it("keeps the existing empty-list state", () => {
    renderList({ expenses: [] });

    expect(screen.getByText("No expenses yet.")).toBeVisible();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
