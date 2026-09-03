import { describe, expect, it, vi } from "vitest";
import { UserStore } from "./user-store";

describe("UserStore", () => {
  it("reuses an existing user ID", () => {
    const createId = vi.fn(() => "new-user");
    const store = new UserStore({ userId: "existing-user", createId });
    expect(store.getOrCreateUserId()).toBe("existing-user");
    expect(createId).not.toHaveBeenCalled();
  });

  it("creates and stores a missing user ID once", () => {
    const createId = vi.fn(() => "new-user");
    const store = new UserStore({ createId });
    expect(store.getOrCreateUserId()).toBe("new-user");
    expect(store.getOrCreateUserId()).toBe("new-user");
    expect(createId).toHaveBeenCalledTimes(1);
  });
});
