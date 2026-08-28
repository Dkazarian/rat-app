import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RatDialogue } from "./rat-dialogue";

describe("RatDialogue", () => {
  it("uses polite live feedback for success", () => {
    render(
      <RatDialogue
        state="success"
        announcement="polite"
        title="Done"
        detail="3 expenses sorted."
      />,
    );

    expect(screen.getByText("Done").parentElement).toHaveAttribute(
      "aria-live",
      "polite",
    );
  });

  it("uses an alert for errors", () => {
    render(
      <RatDialogue
        state="provider-error"
        announcement="assertive"
        title="Something went wrong"
        detail="Try again."
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Something went wrong");
  });
});
