import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { SessionApi } from "@/features/dashboard/api/session-api-client";
import { useSessionBootstrap } from "./use-session-bootstrap";

describe("useSessionBootstrap", () => {
  it("initializes the cookie-backed session without exposing its identity", async () => {
    const api = {
      createSession: vi.fn().mockResolvedValue(undefined),
    } as unknown as SessionApi;
    const { result } = renderHook(() => useSessionBootstrap(api));

    await waitFor(() => expect(result.current.isReady).toBe(true));
    expect(result.current).toEqual({
      isReady: true,
      error: undefined,
      retry: expect.any(Function),
    });
  });

  it("clears readiness and initializes again when retried", async () => {
    const api = {
      createSession: vi.fn().mockResolvedValue(undefined),
    } as unknown as SessionApi;
    const { result } = renderHook(() => useSessionBootstrap(api));
    await waitFor(() => expect(result.current.isReady).toBe(true));

    act(() => result.current.retry());

    await waitFor(() => expect(api.createSession).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(result.current.isReady).toBe(true));
  });
});
