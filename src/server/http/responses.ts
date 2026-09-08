import { z } from "zod";
import {
  ApplicationError,
  RepositoryUnavailableError,
} from "@/server/domain/errors";

export function errorResponse(error: unknown): Response {
  const headers: Record<string, string> = { "Cache-Control": "no-store" };
  if (error instanceof ApplicationError) {
    if (error.retryAfterSeconds !== undefined) {
      headers["Retry-After"] = String(error.retryAfterSeconds);
    }
    return Response.json(
      {
        error: {
          code: error.code,
          message: error.message,
          ...(error.field ? { field: error.field } : {}),
        },
      },
      { status: error.status, headers },
    );
  }
  if (error instanceof RepositoryUnavailableError) {
    return Response.json(
      {
        error: {
          code: "service_unavailable",
          message: "The session service is temporarily unavailable.",
        },
      },
      { status: 503, headers },
    );
  }
  if (error instanceof z.ZodError || error instanceof SyntaxError) {
    return Response.json(
      {
        error: { code: "invalid_request", message: "The request is invalid." },
      },
      { status: 400, headers },
    );
  }
  return Response.json(
    {
      error: {
        code: "internal_error",
        message: "The request could not be completed.",
      },
    },
    { status: 500, headers },
  );
}
