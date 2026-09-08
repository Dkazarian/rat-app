import { readSeedSessionId } from "./seed-arguments";
import { seedExistingSession } from "./seed-session";
import { logger } from "@/server/logger";

try {
  const sessionId = readSeedSessionId(process.argv.slice(2));
  await seedExistingSession(sessionId);
  logger.info("Seeded data into anonymous session.");
} catch {
  logger.error("Redis seeding failed.");
  process.exitCode = 1;
}
