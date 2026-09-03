import { errorResponse, noStoreJson } from "@/server/http/responses";
import { getExpenseManager } from "@/server/redis/persistence";
import { requireSessionId } from "@/server/session/session-id";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = Readonly<{
  params: Promise<Readonly<{ sessionId: string }>>;
}>;

export async function GET(_request: Request, context: RouteContext) {
  try {
    const sessionId = await requireSessionId((await context.params).sessionId);
    return noStoreJson(await getExpenseManager().getExpenses(sessionId));
  } catch (error) {
    return errorResponse(error);
  }
}
