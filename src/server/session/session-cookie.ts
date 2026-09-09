import type { ResolvedSession } from "@/server/session/resolve-session";
import { getServerConfig } from "@/server/config";
import { SESSION_COOKIE_NAME } from "@/server/session/session-id";

export function issueSessionCookie(
  response: Response,
  resolved: ResolvedSession | undefined,
): Response {
  if (!resolved?.created) return response;

  const config = getServerConfig();
  const attributes = [
    `${SESSION_COOKIE_NAME}=${resolved.sessionId}`,
    "Path=/",
    `Max-Age=${config.sessionTtlSeconds}`,
    "HttpOnly",
    "SameSite=lax",
  ];
  if (config.environment === "production") attributes.push("Secure");
  response.headers.append("Set-Cookie", attributes.join("; "));
  return response;
}
