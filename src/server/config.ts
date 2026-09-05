import { z } from "zod";

const positiveIntegerString = (fallback: number) =>
  z
    .string()
    .default(String(fallback))
    .refine((value) => /^\d+$/.test(value), "Must be a positive integer")
    .transform(Number)
    .pipe(z.number().int().positive().safe());

const environmentSchema = z.object({
  KV_REST_API_URL: z.url().startsWith("https://"),
  KV_REST_API_TOKEN: z.string().min(1),
  RATAPP_REDIS_KEY_PREFIX: z
    .string()
    .min(1)
    .max(128)
    .regex(/^[A-Za-z0-9][A-Za-z0-9:_-]*$/),
  RATAPP_SESSION_TTL_SECONDS: positiveIntegerString(172_800),
  RATAPP_MAX_EXPENSES_PER_SESSION: positiveIntegerString(100),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

export type ServerConfig = Readonly<{
  redisUrl: string;
  redisToken: string;
  redisKeyPrefix: string;
  sessionTtlSeconds: number;
  maxExpensesPerSession: number;
  environment: "development" | "test" | "production";
}>;

export class ServerConfigurationError extends Error {
  constructor(options?: ErrorOptions) {
    super("Server configuration is invalid.", options);
    this.name = "ServerConfigurationError";
  }
}

export function parseServerConfig(
  source: Record<string, string | undefined>,
): ServerConfig {
  const value = environmentSchema.parse({
    ...source,
    KV_REST_API_URL: source.KV_REST_API_URL ?? source.REDIS_KV_REST_API_URL,
    KV_REST_API_TOKEN:
      source.KV_REST_API_TOKEN ?? source.REDIS_KV_REST_API_TOKEN,
  });
  return {
    redisUrl: value.KV_REST_API_URL,
    redisToken: value.KV_REST_API_TOKEN,
    redisKeyPrefix: value.RATAPP_REDIS_KEY_PREFIX,
    sessionTtlSeconds: value.RATAPP_SESSION_TTL_SECONDS,
    maxExpensesPerSession: value.RATAPP_MAX_EXPENSES_PER_SESSION,
    environment: value.NODE_ENV,
  };
}

let cachedConfig: ServerConfig | undefined;

export function getServerConfig(): ServerConfig {
  if (!cachedConfig) {
    try {
      cachedConfig = parseServerConfig(process.env);
    } catch (error) {
      throw new ServerConfigurationError({ cause: error });
    }
  }
  return cachedConfig;
}

export function clearServerConfigCacheForTests(): void {
  cachedConfig = undefined;
}
