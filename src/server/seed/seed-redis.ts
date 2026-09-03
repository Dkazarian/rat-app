import { getServerConfig } from "@/server/config";
import { createId, parseId } from "@/server/ids";
import { getRedisClient } from "@/server/redis/client";
import { seedSession } from "./seed-session";

function readSessionId(args: ReadonlyArray<string>): string {
  if (args.length === 0) return createId();
  if (args.length !== 2 || args[0] !== "--session-id") {
    throw new Error("Usage: npm run seed:redis -- [--session-id <uuid>]");
  }
  return parseId(args[1]);
}

try {
  const config = getServerConfig();
  const sessionId = await seedSession(
    getRedisClient(),
    config,
    readSessionId(process.argv.slice(2)),
  );
  console.log(`Seeded anonymous session ${sessionId}.`);
} catch (error) {
  console.error(
    error instanceof Error ? error.message : "Redis seeding failed.",
  );
  process.exitCode = 1;
}
