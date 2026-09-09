import type { NextRequest } from "next/server";
import { getExpenses } from "@/server/redis/expenses";
import { withOptionalSession } from "@/server/session/session-handler";

export async function GET(request: NextRequest) {
  return withOptionalSession(request, async (sessionId) => {
    if (!sessionId) return Response.json({ expenses: [] });
    return Response.json(await getExpenses(sessionId));
  });
}
