import { z } from "zod";
import {
  ApplicationError,
  RepositoryUnavailableError,
} from "@/server/domain/errors";

export function errorResponse(error: unknown): Response {
  const options = { headers: { "Cache-Control": "no-store" } };
  if (error instanceof ApplicationError) {
    return Response.json(
      {
        error: {
          code: error.code,
          message: error.message,
          ...(error.field ? { field: error.field } : {}),
        },
      },
      { status: error.status, ...options },
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
      { status: 503, ...options },
    );
  }
  if (error instanceof z.ZodError || error instanceof SyntaxError) {
    return Response.json(
      {
        error: { code: "invalid_request", message: "The request is invalid." },
      },
      { status: 400, ...options },
    );
  }
  return Response.json(
    {
      error: {
        code: "internal_error",
        message: "The request could not be completed.",
      },
    },
    { status: 500, ...options },
  );
}
