import type { NextRequest } from "next/server";
import { toExpensesResponse } from "@/server/domain/expense-rules";
import { listCategories } from "@/server/redis/categories";
import { listExpenses } from "@/server/redis/expenses";
import { withOptionalSession } from "@/server/session/session-handler";

export async function GET(request: NextRequest) {
  return withOptionalSession(request, async (sessionId) => {
    if (!sessionId) return Response.json({ expenses: [] });
    const [categories, expenses] = await Promise.all([
      listCategories(sessionId),
      listExpenses(sessionId),
    ]);
    return Response.json(
      toExpensesResponse(
        expenses,
        new Set(categories.map(({ id }) => id)),
      ),
    );
  });
}
