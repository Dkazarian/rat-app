export type SessionKeys = Readonly<{
  meta: string;
  categories: string;
  expenses: string;
}>;

export type AiRateLimitKeys = Readonly<{
  sessionBurst: string;
  globalBurst: string;
}>;

export function createSessionKeys(
  prefix: string,
  sessionId: string,
): SessionKeys {
  const root = `${prefix}:session:v1:{${sessionId}}`;
  return {
    meta: `${root}:meta`,
    categories: `${root}:categories`,
    expenses: `${root}:expenses`,
  };
}

export function createAiRateLimitKeys(
  prefix: string,
  sessionId: string,
): AiRateLimitKeys {
  return {
    sessionBurst: `${prefix}:ratelimit:ai:burst:{${sessionId}}`,
    globalBurst: `${prefix}:ratelimit:ai:global`,
  };
}
