import type { NextRequest } from "next/server";
import { parseId } from "@/server/ids";
import { errorResponse } from "@/server/http/responses";
import { deleteExpense } from "@/server/redis/expenses";
import {
  requireSessionId,
  SESSION_COOKIE_NAME,
} from "@/server/session/session-id";

type RouteContext = Readonly<{
  params: Promise<Readonly<{ expenseId: string }>>;
}>;

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const sessionId = await requireSessionId(
      request.cookies.get(SESSION_COOKIE_NAME)?.value,
    );
    const { expenseId } = await context.params;
    await deleteExpense(sessionId, parseId(expenseId));
    return new Response(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}
