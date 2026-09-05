import { createId, isCanonicalId } from "@/server/ids";

export type SessionIdStore = Readonly<{
  getSessionId(sessionId: string): Promise<string | null>;
  saveSessionId(sessionId: string): Promise<void>;
}>;

export type ResolvedSession = Readonly<{
  sessionId: string;
  created: boolean;
}>;

export async function resolveSession(
  repository: SessionIdStore,
  cookieSessionId: string | undefined,
): Promise<ResolvedSession> {
  if (
    isCanonicalId(cookieSessionId) &&
    (await repository.getSessionId(cookieSessionId))
  ) {
    return { sessionId: cookieSessionId, created: false };
  }

  const sessionId = createId();
  await repository.saveSessionId(sessionId);
  return { sessionId, created: true };
}
