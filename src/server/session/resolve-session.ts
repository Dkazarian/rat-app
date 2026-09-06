import { createId, isCanonicalId } from "@/server/ids";
import {
  getSessionId,
  renewSessionTtl,
  saveSessionId,
} from "@/server/redis/session-repository";

export type ResolvedSession = Readonly<{
  sessionId: string;
  created: boolean;
}>;

export async function resolveSession(
  cookieSessionId: string | undefined,
): Promise<ResolvedSession> {
  if (isCanonicalId(cookieSessionId) && (await getSessionId(cookieSessionId))) {
    await renewSessionTtl(cookieSessionId);
    return { sessionId: cookieSessionId, created: false };
  }

  const sessionId = createId();
  await saveSessionId(sessionId);
  return { sessionId, created: true };
}
