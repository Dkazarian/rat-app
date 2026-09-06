"use client";

import { useCallback, useEffect, useState } from "react";
import type { SessionApi } from "@/features/dashboard/api/session-api-client";

export function useSessionBootstrap(api: SessionApi) {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<unknown>();
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    api.createSession(controller.signal).then(
      () => {
        setIsReady(true);
        setError(undefined);
      },
      (reason) => {
        if (!controller.signal.aborted) setError(reason);
      },
    );
    return () => controller.abort();
  }, [api, attempt]);

  const retry = useCallback(() => {
    setIsReady(false);
    setError(undefined);
    setAttempt((value) => value + 1);
  }, []);

  return { isReady, error, retry };
}
