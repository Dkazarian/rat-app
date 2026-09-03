"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SessionApi } from "@/features/dashboard/api/session-api-client";

export function usePageSession(api: SessionApi) {
  const [sessionId, setSessionId] = useState<string>();
  const [error, setError] = useState<unknown>();
  const [attempt, setAttempt] = useState(0);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [isMutating, setIsMutating] = useState(false);
  const mutationActive = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    api.createSession(controller.signal).then(
      ({ sessionId: nextSessionId }) => {
        setSessionId(nextSessionId);
        setError(undefined);
      },
      (reason) => {
        if (!controller.signal.aborted) setError(reason);
      },
    );
    return () => controller.abort();
  }, [api, attempt]);

  const retry = useCallback(() => {
    setSessionId(undefined);
    setError(undefined);
    setAttempt((value) => value + 1);
  }, []);
  const notifyDataChanged = useCallback(
    () => setRefreshCounter((value) => value + 1),
    [],
  );
  const runMutation = useCallback(
    async <T>(mutation: () => Promise<T>): Promise<T> => {
      if (mutationActive.current) {
        throw new Error("A mutation is already in progress.");
      }
      mutationActive.current = true;
      setIsMutating(true);
      try {
        return await mutation();
      } finally {
        mutationActive.current = false;
        setIsMutating(false);
      }
    },
    [],
  );

  return {
    sessionId,
    isReady: sessionId !== undefined,
    error,
    retry,
    isMutating,
    runMutation,
    refreshCounter,
    notifyDataChanged,
  };
}
