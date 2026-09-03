import type { ServerConfig } from "@/server/config";
import { applicationErrors } from "@/server/domain/errors";
import { createId, isCanonicalId } from "@/server/ids";

export type SessionIdStore = Readonly<{
  getSessionId(sessionId: string): Promise<string | null>;
  saveSessionId(sessionId: string): Promise<void>;
  getActiveSeedSessionId(): Promise<string | null>;
}>;

export type ResolvedSession = Readonly<{
  sessionId: string;
  created: boolean;
}>;

export async function resolveSession(
  repository: SessionIdStore,
  config: ServerConfig,
  cookieSessionId: string | undefined,
): Promise<ResolvedSession> {
  if (config.useSeededSession) {
    const seededSessionId = await repository.getActiveSeedSessionId();
    if (!seededSessionId || !(await repository.getSessionId(seededSessionId))) {
      throw applicationErrors.seedUnavailable();
    }
    return { sessionId: seededSessionId, created: false };
  }

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
