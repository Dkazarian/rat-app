import { describe, expect, it } from "vitest";

import { dashboardFixtures, dashboardStates } from "./dashboard-view-fixtures";

describe("dashboardFixtures", () => {
  it("provides every required deterministic state", () => {
    expect(Object.keys(dashboardFixtures)).toEqual(dashboardStates);
  });

  it("derives the success total and chart percentages from categories", () => {
    const fixture = dashboardFixtures.success;

    expect(fixture.categorySpending.totalMinor).toBe(128_450);
    expect(
      fixture.categorySpending.items.map(({ percent }) => percent),
    ).toEqual([40, 26, 20, 14]);
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
