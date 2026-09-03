import { NextResponse } from "next/server";
import { z } from "zod";
import type { ApiErrorResponse } from "@/contracts/session-api";
import {
  ApplicationError,
  RepositoryUnavailableError,
} from "@/server/domain/errors";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" } as const;
const DEFAULT_MAX_JSON_BYTES = 4_096;

export async function readBoundedJson<T>(
  request: Request,
  schema: z.ZodType<T>,
  maxBytes = DEFAULT_MAX_JSON_BYTES,
): Promise<T> {
  const declaredLength = request.headers.get("content-length");
  if (declaredLength && Number(declaredLength) > maxBytes) {
    throw new SyntaxError("Request body is too large");
  }
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > maxBytes) {
    throw new SyntaxError("Request body is too large");
  }
  return schema.parse(JSON.parse(text) as unknown);
}

export function noStoreJson<T>(body: T, status = 200): NextResponse<T> {
  return NextResponse.json(body, { status, headers: NO_STORE_HEADERS });
}

export function noStoreEmpty(status = 204): NextResponse {
  return new NextResponse(null, { status, headers: NO_STORE_HEADERS });
}

export function errorResponse(error: unknown): NextResponse<ApiErrorResponse> {
  if (error instanceof ApplicationError) {
    return noStoreJson(
      {
        error: {
          code: error.code,
          message: error.message,
          ...(error.field ? { field: error.field } : {}),
        },
      },
      error.status,
    );
  }
  if (error instanceof RepositoryUnavailableError) {
    return noStoreJson(
      {
        error: {
          code: "service_unavailable",
          message: "The session service is temporarily unavailable.",
        },
      },
      503,
    );
  }
  if (error instanceof z.ZodError || error instanceof SyntaxError) {
    return noStoreJson(
      {
        error: { code: "invalid_request", message: "The request is invalid." },
      },
      400,
    );
  }
  return noStoreJson(
    {
      error: {
        code: "internal_error",
        message: "The request could not be completed.",
      },
    },
    500,
  );
}
