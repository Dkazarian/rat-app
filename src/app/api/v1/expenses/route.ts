import type { NextRequest } from "next/server";
import { errorResponse } from "@/server/http/responses";
import { getExpenses } from "@/server/redis/expenses";
import {
  requireSessionId,
  SESSION_COOKIE_NAME,
} from "@/server/session/session-id";

export async function GET(request: NextRequest) {
  try {
    const sessionId = await requireSessionId(
      request.cookies.get(SESSION_COOKIE_NAME)?.value,
    );
    return Response.json(await getExpenses(sessionId));
  } catch (error) {
    return errorResponse(error);
  }
}
