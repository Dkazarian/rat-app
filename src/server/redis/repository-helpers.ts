import {
  ApplicationError,
  RepositoryUnavailableError,
} from "@/server/domain/errors";

export const encodeRecord = (value: unknown): string => JSON.stringify(value);

export const decodeRecord = (value: unknown): unknown => {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
};

export async function redisOperation<T>(
  operation: () => Promise<T>,
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof ApplicationError) throw error;
    if (error instanceof RepositoryUnavailableError) throw error;
    throw new RepositoryUnavailableError({ cause: error });
  }
}
