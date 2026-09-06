export type SessionKeys = Readonly<{
  meta: string;
  categories: string;
  expenses: string;
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
