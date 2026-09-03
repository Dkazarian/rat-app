import type { NextRequest } from "next/server";
import type { SessionResponse } from "@/contracts/session-api";
import { getServerConfig } from "@/server/config";
import { errorResponse, noStoreJson } from "@/server/http/responses";
import { getSessionRepository } from "@/server/redis/persistence";
import { SESSION_COOKIE_NAME } from "@/server/session/session-id";
import { resolveSession } from "@/server/session/resolve-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const config = getServerConfig();
    const resolved = await resolveSession(
      getSessionRepository(),
      config,
      request.cookies.get(SESSION_COOKIE_NAME)?.value,
    );
    const response = noStoreJson<SessionResponse>(
      { sessionId: resolved.sessionId },
      resolved.created ? 201 : 200,
    );
    response.cookies.set(SESSION_COOKIE_NAME, resolved.sessionId, {
      httpOnly: true,
      sameSite: "lax",
      secure: config.environment === "production",
      path: "/",
    });
    return response;
  } catch (error) {
    return errorResponse(error);
  }
}
