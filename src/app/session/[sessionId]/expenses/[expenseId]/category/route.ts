import type { ExpenseMutationResponse } from "@/contracts/session-api";
import {
  errorResponse,
  noStoreJson,
  readBoundedJson,
} from "@/server/http/responses";
import { parseId } from "@/server/ids";
import { getExpenseManager } from "@/server/redis/persistence";
import { requireSessionId } from "@/server/session/session-id";
import { expenseCategoryBodySchema } from "@/server/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = Readonly<{
  params: Promise<Readonly<{ sessionId: string; expenseId: string }>>;
}>;

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { sessionId: unsafeSessionId, expenseId: unsafeExpenseId } =
      await context.params;
    const sessionId = await requireSessionId(unsafeSessionId);
    const expenseId = parseId(unsafeExpenseId);
    const { categoryId } = await readBoundedJson(
      request,
      expenseCategoryBodySchema,
    );
    const expense = await getExpenseManager().updateExpenseCategory(
      sessionId,
      expenseId,
      categoryId,
    );
    return noStoreJson<ExpenseMutationResponse>({ expense });
  } catch (error) {
    return errorResponse(error);
  }
}
