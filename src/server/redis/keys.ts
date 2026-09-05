import { parseId } from "@/server/ids";

export type SessionKeys = Readonly<{
  meta: string;
  categories: string;
  expenses: string;
}>;

export function createSessionKeys(
  prefix: string,
  unsafeSessionId: unknown,
): SessionKeys {
  const sessionId = parseId(unsafeSessionId);
  const root = `${prefix}:session:v1:{${sessionId}}`;
  return {
    meta: `${root}:meta`,
    categories: `${root}:categories`,
    expenses: `${root}:expenses`,
  };
}
