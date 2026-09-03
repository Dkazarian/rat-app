import { applicationErrors } from "@/server/domain/errors";
import { parseId } from "@/server/ids";
import { getSessionRepository } from "@/server/redis/persistence";

export const SESSION_COOKIE_NAME = "ratapp_session";

type SessionLookup = Readonly<{
  getSessionId(sessionId: string): Promise<string | null>;
}>;

export async function requireSessionId(
  unsafeSessionId: unknown,
  store: SessionLookup = getSessionRepository(),
): Promise<string> {
  let sessionId: string;
  try {
    sessionId = parseId(unsafeSessionId);
  } catch {
    throw applicationErrors.invalidRequest();
  }
  if (!(await store.getSessionId(sessionId))) {
    throw applicationErrors.sessionNotFound();
  }
  return sessionId;
}
