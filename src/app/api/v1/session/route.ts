import { NextResponse, type NextRequest } from "next/server";
import { getServerConfig } from "@/server/config";
import { errorResponse } from "@/server/http/responses";
import { SESSION_COOKIE_NAME } from "@/server/session/session-id";
import { resolveSession } from "@/server/session/resolve-session";

export async function POST(request: NextRequest) {
  try {
    const config = getServerConfig();
    const resolved = await resolveSession(
      request.cookies.get(SESSION_COOKIE_NAME)?.value,
    );
    const response = new NextResponse(null, { status: 204 });
    response.cookies.set(SESSION_COOKIE_NAME, resolved.sessionId, {
      httpOnly: true,
      sameSite: "lax",
      secure: config.environment === "production",
      path: "/",
      maxAge: config.sessionTtlSeconds,
    });
    return response;
  } catch (error) {
    return errorResponse(error);
  }
}
