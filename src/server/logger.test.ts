import { afterEach, describe, expect, it, vi } from "vitest";
import { logger } from "./logger";

afterEach(() => vi.restoreAllMocks());

describe("logger", () => {
  it.each([
    ["info", "info"],
    ["warn", "warn"],
    ["error", "error"],
  ] as const)("forwards %s messages and context", (method, consoleMethod) => {
    const spy = vi.spyOn(console, consoleMethod).mockImplementation(() => {});
    logger[method]("event", { code: "safe_code" });
    expect(spy).toHaveBeenCalledWith("event", { code: "safe_code" });
  });

  it("uses an empty context by default", () => {
    const spy = vi.spyOn(console, "info").mockImplementation(() => {});
    logger.info("event");
    expect(spy).toHaveBeenCalledWith("event", {});
  });
});
