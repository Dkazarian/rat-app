import { readSeedSessionId } from "./seed-arguments";
import { seedExistingSession } from "./seed-session";

try {
  const sessionId = readSeedSessionId(process.argv.slice(2));
  await seedExistingSession(sessionId);
  console.log(`Seeded data into anonymous session ${sessionId}.`);
} catch (error) {
  console.error(
    error instanceof Error ? error.message : "Redis seeding failed.",
  );
  process.exitCode = 1;
}
