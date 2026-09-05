import { parseId } from "@/server/ids";

const usage = "Usage: npm run seed:redis -- --session-id <uuid>";

export function readSeedSessionId(args: ReadonlyArray<string>): string {
  if (args.length !== 2 || args[0] !== "--session-id") {
    throw new Error(usage);
  }
  return parseId(args[1]);
}
