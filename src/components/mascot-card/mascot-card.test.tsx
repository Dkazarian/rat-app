import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderWithProviders } from "@/test/render";

import { MascotCard } from "./mascot-card";

describe("MascotCard", () => {
  it("renders its message and mascot accessibly", () => {
    renderWithProviders(
      <MascotCard
        eyebrow="Foundation ready"
        title="Ratapp is ready"
        description="The component toolchain works."
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Ratapp is ready" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Ratapp mascot" }),
    ).toBeInTheDocument();
  });
});
