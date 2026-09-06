"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ExpensesResponse } from "@/contracts/session-api";
import type { SessionApi } from "@/features/dashboard/api/session-api-client";

export function useExpenseQuery(api: SessionApi, refreshCounter: number) {
  const [data, setData] = useState<ExpensesResponse>();
  const [error, setError] = useState<unknown>();
  const [retryCounter, setRetryCounter] = useState(0);
  const sequence = useRef(0);

  useEffect(() => {
    const controller = new AbortController();
    const requestSequence = ++sequence.current;
    api.getExpenses(controller.signal).then(
      (response) => {
        if (requestSequence === sequence.current) {
          setData(response);
          setError(undefined);
        }
      },
      (reason) => {
        if (
          !controller.signal.aborted &&
          requestSequence === sequence.current
        ) {
          setError(reason);
        }
      },
    );
    return () => controller.abort();
  }, [api, refreshCounter, retryCounter]);

  return {
    data,
    error,
    isLoading: data === undefined && error === undefined,
    retry: useCallback(() => {
      setError(undefined);
      setRetryCounter((value) => value + 1);
    }, []),
  };
}
