import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";

/** Extend this helper with shared providers when application state is introduced. */
export function renderWithProviders(ui: ReactElement) {
  return { user: userEvent.setup(), ...render(ui) };
}
