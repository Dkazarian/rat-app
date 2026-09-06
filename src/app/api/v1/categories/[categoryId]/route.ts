import type { NextRequest } from "next/server";
import { errorResponse } from "@/server/http/responses";
import { deleteCategory } from "@/server/redis/categories";
import {
  requireSessionId,
  SESSION_COOKIE_NAME,
} from "@/server/session/session-id";

type RouteContext = Readonly<{
  params: Promise<Readonly<{ categoryId: string }>>;
}>;

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const sessionId = await requireSessionId(
      request.cookies.get(SESSION_COOKIE_NAME)?.value,
    );
    const { categoryId } = await context.params;
    await deleteCategory(sessionId, categoryId);
    return new Response(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}
