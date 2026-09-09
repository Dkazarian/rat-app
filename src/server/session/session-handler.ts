import type { NextRequest } from "next/server";
import { errorResponse } from "@/server/http/responses";
import { issueSessionCookie } from "@/server/session/session-cookie";
import { SESSION_COOKIE_NAME } from "@/server/session/session-id";
import {
  resolveExistingSession,
  resolveSession,
  type ResolvedSession,
} from "@/server/session/resolve-session";

type SessionHandler = (sessionId: string) => Response | Promise<Response>;
type OptionalSessionHandler = (
  sessionId: string | null,
) => Response | Promise<Response>;
type ErrorHandler = (error: unknown) => Response;

function cookieSessionId(request: NextRequest): string | undefined {
  return request.cookies.get(SESSION_COOKIE_NAME)?.value;
}

export async function withOptionalSession(
  request: NextRequest,
  handler: OptionalSessionHandler,
  handleError: ErrorHandler = errorResponse,
): Promise<Response> {
  try {
    const sessionId = await resolveExistingSession(cookieSessionId(request));
    return await handler(sessionId);
  } catch (error) {
    return handleError(error);
  }
}

export async function withLazySession(
  request: NextRequest,
  handler: SessionHandler,
  handleError: ErrorHandler = errorResponse,
): Promise<Response> {
  let resolved: ResolvedSession | undefined;
  try {
    resolved = await resolveSession(cookieSessionId(request));
    return issueSessionCookie(await handler(resolved.sessionId), resolved);
  } catch (error) {
    return issueSessionCookie(handleError(error), resolved);
  }
}
