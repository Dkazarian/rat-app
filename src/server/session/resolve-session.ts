import { createId, isCanonicalId } from "@/server/ids";
import { getSessionId, saveSessionId } from "@/server/redis/session-repository";

export type ResolvedSession = Readonly<{
  sessionId: string;
  created: boolean;
}>;

export async function resolveExistingSession(
  cookieSessionId: string | undefined,
): Promise<string | null> {
  if (!isCanonicalId(cookieSessionId)) return null;
  return getSessionId(cookieSessionId);
}

export async function resolveSession(
  cookieSessionId: string | undefined,
): Promise<ResolvedSession> {
  const existingSessionId = await resolveExistingSession(cookieSessionId);
  if (existingSessionId) {
    return { sessionId: existingSessionId, created: false };
  }

  const sessionId = createId();
  await saveSessionId(sessionId);
  return { sessionId, created: true };
}
