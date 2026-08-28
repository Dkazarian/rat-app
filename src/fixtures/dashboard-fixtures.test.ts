import { describe, expect, it } from "vitest";

import { dashboardStates } from "@/types/presentation";

import { dashboardFixtures } from "./dashboard-fixtures";

describe("dashboardFixtures", () => {
  it("provides every required deterministic state", () => {
    expect(Object.keys(dashboardFixtures)).toEqual(dashboardStates);
  });

  it("derives the success total and chart percentages from categories", () => {
    const fixture = dashboardFixtures.success;

    expect(fixture.spending.totalMinor).toBe(128_450);
    expect(fixture.spending.items.map(({ percent }) => percent)).toEqual([
      40, 26, 20, 14,
    ]);
  });

  it("uses a distinct awaiting mascot before any input is submitted", () => {
    expect(dashboardFixtures.empty.feedback.mascotSrc).toBe(
      "/assets/rat-mascot-awaiting.png",
    );
    expect(dashboardFixtures.empty.feedback.mascotSrc).not.toBe(
      dashboardFixtures.success.feedback.mascotSrc,
    );
  });

  it("preserves submitted input in recoverable states", () => {
    expect(dashboardFixtures["extraction-failure"].inputValue).toBe(
      dashboardFixtures.loading.inputValue,
    );
    expect(dashboardFixtures["provider-error"].inputValue).toBe(
      dashboardFixtures.loading.inputValue,
    );
  });
});
