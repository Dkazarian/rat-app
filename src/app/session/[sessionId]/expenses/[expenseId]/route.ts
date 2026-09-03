import { errorResponse, noStoreEmpty } from "@/server/http/responses";
import { parseId } from "@/server/ids";
import { getExpenseManager } from "@/server/redis/persistence";
import { requireSessionId } from "@/server/session/session-id";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = Readonly<{
  params: Promise<Readonly<{ sessionId: string; expenseId: string }>>;
}>;

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { sessionId: unsafeSessionId, expenseId: unsafeExpenseId } =
      await context.params;
    const sessionId = await requireSessionId(unsafeSessionId);
    const expenseId = parseId(unsafeExpenseId);
    await getExpenseManager().deleteExpense(sessionId, expenseId);
    return noStoreEmpty();
  } catch (error) {
    return errorResponse(error);
  }
}
