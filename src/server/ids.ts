import { canonicalUuidSchema } from "@/server/validation";

export function createId(): string {
  return crypto.randomUUID();
}

export function parseId(value: unknown): string {
  return canonicalUuidSchema.parse(value);
}

export function isCanonicalId(value: unknown): value is string {
  return canonicalUuidSchema.safeParse(value).success;
}
