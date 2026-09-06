import { z } from "zod";
import {
  ApplicationError,
  RepositoryUnavailableError,
} from "@/server/domain/errors";

export function errorResponse(error: unknown): Response {
  if (error instanceof ApplicationError) {
    return Response.json(
      {
        error: {
          code: error.code,
          message: error.message,
          ...(error.field ? { field: error.field } : {}),
        },
      },
      { status: error.status },
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
      { status: 503 },
    );
  }
  if (error instanceof z.ZodError || error instanceof SyntaxError) {
    return Response.json(
      {
        error: { code: "invalid_request", message: "The request is invalid." },
      },
      { status: 400 },
    );
  }
  return Response.json(
    {
      error: {
        code: "internal_error",
        message: "The request could not be completed.",
      },
    },
    { status: 500 },
  );
}
