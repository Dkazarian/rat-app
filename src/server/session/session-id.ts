import { applicationErrors } from "@/server/domain/errors";
import { isCanonicalId } from "@/server/ids";
import { getSessionId } from "@/server/redis/session-repository";

export const SESSION_COOKIE_NAME = "ratapp_session";

export async function requireSessionId(
  cookieSessionId: string | undefined,
): Promise<string> {
  if (
    !isCanonicalId(cookieSessionId) ||
    !(await getSessionId(cookieSessionId))
  ) {
    throw applicationErrors.sessionNotFound();
  }
  return cookieSessionId;
}
