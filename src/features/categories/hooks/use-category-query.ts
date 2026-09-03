"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CategoriesResponse } from "@/contracts/session-api";
import type { SessionApi } from "@/features/dashboard/api/session-api-client";

export function useCategoryQuery(
  api: SessionApi,
  sessionId: string,
  refreshCounter: number,
  locale: string,
) {
  const [data, setData] = useState<CategoriesResponse>();
  const [error, setError] = useState<unknown>();
  const [retryCounter, setRetryCounter] = useState(0);
  const sequence = useRef(0);

  useEffect(() => {
    const controller = new AbortController();
    const requestSequence = ++sequence.current;
    api.getCategories(sessionId, controller.signal).then(
      (response) => {
        if (requestSequence !== sequence.current) return;
        const collator = new Intl.Collator(locale, { sensitivity: "base" });
        setData({
          ...response,
          categories: [...response.categories].sort((left, right) =>
            collator.compare(left.name, right.name),
          ),
        });
        setError(undefined);
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
  }, [api, sessionId, refreshCounter, retryCounter, locale]);

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
