import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { SessionApi } from "@/features/dashboard/api/session-api-client";
import { usePageSession } from "./use-page-session";

const api = {
  createSession: vi.fn().mockResolvedValue({ sessionId: "session-id" }),
} as unknown as SessionApi;

describe("usePageSession", () => {
  it("initializes a session and exposes refresh coordination", async () => {
    const { result } = renderHook(() => usePageSession(api));
    await waitFor(() => expect(result.current.sessionId).toBe("session-id"));
    act(() => result.current.notifyDataChanged());
    expect(result.current.refreshCounter).toBe(1);
  });

  it("permits only one mutation until the active request settles", async () => {
    let release!: () => void;
    const pending = new Promise<void>((resolve) => (release = resolve));
    const { result } = renderHook(() => usePageSession(api));
    await waitFor(() => expect(result.current.isReady).toBe(true));

    let first!: Promise<void>;
    act(() => {
      first = result.current.runMutation(() => pending);
    });
    expect(result.current.isMutating).toBe(true);
    await expect(
      result.current.runMutation(async () => undefined),
    ).rejects.toThrow("already in progress");
    await act(async () => {
      release();
      await first;
    });
    expect(result.current.isMutating).toBe(false);
  });
});
